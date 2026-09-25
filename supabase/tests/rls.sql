-- Pruebas de las políticas RLS. Se ejecutan dentro de una transacción que termina en
-- ROLLBACK: no dejan datos. Si una expectativa falla, se lanza una excepción con el motivo.
-- Simula usuarios con request.jwt.claims + role authenticated, como hace PostgREST.

begin;

-- Usuarios de prueba: un profesor, dos estudiantes anónimos y un intruso de otro curso.
insert into auth.users (id, aud, role, email, is_anonymous, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'prof@test.local', false, now(), now()),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', null, true, now(), now()),
  ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', null, true, now(), now()),
  ('00000000-0000-4000-8000-0000000000c1', 'authenticated', 'authenticated', null, true, now(), now());

create temp table t_ctx (k text primary key, v text) on commit drop;
grant all on t_ctx to authenticated;

create or replace function pg_temp.as_user(p_id text, p_anon boolean) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', p_anon)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create or replace function pg_temp.expect(p_ok boolean, p_msg text) returns void language plpgsql as $$
begin
  if not p_ok then raise exception 'FALLA: %', p_msg; end if;
end $$;

-- Robot mínimo válido para insertar.
create or replace function pg_temp.robot_json(p_course uuid, p_serial text, p_name text) returns jsonb
language sql as $$
  select jsonb_build_object(
    'course_id', p_course, 'serial', p_serial, 'name', p_name, 'author', 'x', 'type', 'CST',
    'parts', '{"head":0,"rarm":0,"larm":0,"legs":0}'::jsonb, 'color', '#F5C518',
    'rank', '{S,O,H,P,A,L}'::text[], 'limit', 'x', 'answers', '{}'::jsonb, 'reasons', '{}'::jsonb,
    'profile', '{"S":50,"O":50,"H":50,"P":50,"A":50,"L":50}'::jsonb, 'school', 'U',
    'schools', '{"U":1,"D":0,"V":0,"C":0}'::jsonb, 'coherence', 50, 'compat', 50, 'circuit', 'umbral');
$$;

create or replace function pg_temp.insert_robot(p_course uuid, p_serial text, p_name text) returns uuid
language plpgsql as $$
declare j jsonb := pg_temp.robot_json(p_course, p_serial, p_name); rid uuid;
begin
  insert into public.robots (course_id, serial, name, author, type, parts, color, rank, "limit",
    answers, reasons, profile, school, schools, coherence, compat, circuit)
  select (j->>'course_id')::uuid, j->>'serial', j->>'name', j->>'author', j->>'type', j->'parts',
    j->>'color', array['S','O','H','P','A','L'],
    j->>'limit', j->'answers', j->'reasons', j->'profile', j->>'school', j->'schools',
    (j->>'coherence')::int, (j->>'compat')::int, j->>'circuit'
  returning id into rid;
  return rid;
end $$;

do $$
declare
  cid uuid; cid2 uuid; code text; r1 uuid; r2 uuid; n int; ok boolean;
begin
  -- 1. Un anónimo no puede crear cursos; el profesor sí.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000b1', true);
  begin
    insert into public.courses (name) values ('Curso pirata');
    raise exception 'FALLA: un estudiante anónimo creó un curso';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', false);
  insert into public.courses (name) values ('Curso de prueba') returning id, join_code into cid, code;
  perform pg_temp.expect(code ~ '^[A-Z]{3}-[0-9]{4}$', 'join_code con formato KBT-2045: ' || code);
  insert into public.courses (name) values ('Otro curso') returning id into cid2;

  -- 2. Estudiantes entran con el código (en minúsculas y con espacios también).
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000b1', true);
  perform pg_temp.expect(
    (select id from public.join_course(' ' || lower(code) || ' ', 'Ana')) = cid, 'join_course');
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000b2', true);
  perform public.join_course(code, 'Beto');
  begin
    perform public.join_course('ZZZ-0000', 'Beto');
    raise exception 'FALLA: join_course aceptó un código inexistente';
  exception when sqlstate 'P0002' then null;
  end;

  -- 3. Publicar: cada uno su robot.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000b1', true);
  r1 := pg_temp.insert_robot(cid, 'CST-11111', 'Robot de Ana');
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000b2', true);
  r2 := pg_temp.insert_robot(cid, 'CST-22222', 'Robot de Beto');

  -- Serie única por curso.
  begin
    perform pg_temp.insert_robot(cid, 'CST-11111', 'Copia');
    raise exception 'FALLA: se repitió una serie en el curso';
  exception when unique_violation then null;
  end;

  -- 4. Beto ve la galería completa del curso.
  select count(*) into n from public.robots where course_id = cid;
  perform pg_temp.expect(n = 2, 'Beto ve 2 robots, vio ' || n);

  -- 5. Beto NO puede editar ni borrar el robot de Ana.
  update public.robots set name = 'hackeado' where id = r1;
  get diagnostics n = row_count;
  perform pg_temp.expect(n = 0, 'Beto editó el robot de Ana');
  delete from public.robots where id = r1;
  get diagnostics n = row_count;
  perform pg_temp.expect(n = 0, 'Beto borró el robot de Ana');
  -- …ni siquiera el suyo (borrar es solo del profesor).
  delete from public.robots where id = r2;
  get diagnostics n = row_count;
  perform pg_temp.expect(n = 0, 'Un estudiante borró un robot');
  -- Sí puede editar el suyo, pero no cambiarlo de curso.
  update public.robots set name = 'Robot de Beto v2' where id = r2;
  get diagnostics n = row_count;
  perform pg_temp.expect(n = 1, 'Beto no pudo editar su robot');
  begin
    update public.robots set course_id = cid2 where id = r2;
    raise exception 'FALLA: se movió un robot a otro curso';
  exception when insufficient_privilege then null;
  end;

  -- 6. Un intruso (sesión anónima sin unirse) no ve nada ni puede publicar.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000c1', true);
  select count(*) into n from public.robots;
  perform pg_temp.expect(n = 0, 'El intruso ve robots: ' || n);
  select count(*) into n from public.courses;
  perform pg_temp.expect(n = 0, 'El intruso ve cursos');
  begin
    perform pg_temp.insert_robot(cid, 'CST-33333', 'Intruso');
    raise exception 'FALLA: el intruso publicó';
  exception when insufficient_privilege then null;
  end;

  -- 7. Galería cerrada: el estudiante ya no publica ni edita; el profesor sí.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', false);
  update public.courses set gallery_closed = true where id = cid;
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000b2', true);
  update public.robots set name = 'tarde' where id = r2;
  get diagnostics n = row_count;
  perform pg_temp.expect(n = 0, 'Se editó con la galería cerrada');
  begin
    perform pg_temp.insert_robot(cid, 'CST-44444', 'Tarde');
    raise exception 'FALLA: se publicó con la galería cerrada';
  exception when insufficient_privilege then null;
  end;

  -- 8. El profesor borra el robot de Ana.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', false);
  delete from public.robots where id = r1;
  get diagnostics n = row_count;
  perform pg_temp.expect(n = 1, 'El profesor no pudo borrar');

  -- 9. Otro profesor no ve el curso ajeno.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000c1', false);
  select count(*) into n from public.courses where id = cid;
  perform pg_temp.expect(n = 0, 'Un usuario ajeno ve el curso');

  raise notice 'RLS: todas las pruebas pasaron';
end $$;

rollback;
