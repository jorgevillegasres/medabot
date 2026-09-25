-- Pruebas de la Arena (bouts y votes). Transacción con ROLLBACK: no deja datos.

begin;

insert into auth.users (id, aud, role, email, is_anonymous, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'prof@test.local', false, now(), now()),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', null, true, now(), now()),
  ('00000000-0000-4000-8000-0000000000c1', 'authenticated', 'authenticated', null, true, now(), now());

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

create or replace function pg_temp.insert_robot(p_course uuid, p_serial text) returns uuid
language plpgsql as $$
declare rid uuid;
begin
  insert into public.robots (course_id, serial, name, author, type, parts, color, rank, "limit",
    answers, reasons, profile, school, schools, coherence, compat, circuit)
  values (p_course, p_serial, 'R ' || p_serial, 'x', 'CST', '{"head":0,"rarm":0,"larm":0,"legs":0}',
    '#F5C518', array['S','O','H','P','A','L'], 'x', '{}', '{}',
    '{"S":50,"O":50,"H":50,"P":50,"A":50,"L":50}', 'U', '{"U":1,"D":0,"V":0,"C":0}', 50, 50, 'umbral')
  returning id into rid;
  return rid;
end $$;

do $$
declare
  cid uuid; cid2 uuid; code text; ra uuid; rb uuid; rx uuid; bid uuid; n int;
begin
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', false);
  insert into public.courses (name) values ('Curso arena') returning id, join_code into cid, code;
  insert into public.courses (name) values ('Otro') returning id into cid2;
  ra := pg_temp.insert_robot(cid, 'CST-10001');
  rb := pg_temp.insert_robot(cid, 'CST-10002');
  rx := pg_temp.insert_robot(cid2, 'CST-10003');

  -- Robots de otro curso o repetidos: rechazado.
  begin
    insert into public.bouts (course_id, robot_a, robot_b, scenario_id) values (cid, ra, rx, '0');
    raise exception 'FALLA: robatalla con un robot de otro curso';
  exception when check_violation then null;
  end;
  begin
    insert into public.bouts (course_id, robot_a, robot_b, scenario_id) values (cid, ra, ra, '0');
    raise exception 'FALLA: robatalla con el mismo robot dos veces';
  exception when check_violation then null;
  end;

  insert into public.bouts (course_id, robot_a, robot_b, scenario_id) values (cid, ra, rb, '0')
  returning id into bid;

  -- El estudiante entra al curso, ve la robatalla pero no puede crearla ni cambiarla.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000b1', true);
  perform public.join_course(code, 'Ana');
  select count(*) into n from public.bouts where id = bid;
  perform pg_temp.expect(n = 1, 'el estudiante no ve la robatalla');
  update public.bouts set status = 'revealed' where id = bid;
  get diagnostics n = row_count;
  perform pg_temp.expect(n = 0, 'el estudiante cambió el estado');
  begin
    insert into public.bouts (course_id, robot_a, robot_b, scenario_id) values (cid, ra, rb, '1');
    raise exception 'FALLA: el estudiante creó una robatalla';
  exception when insufficient_privilege then null;
  end;

  -- Vota antes del giro; un segundo voto en la misma fase se rechaza.
  insert into public.votes (bout_id, phase, side, option_idx) values (bid, 'before', 'A', 1), (bid, 'before', 'B', 2);
  begin
    insert into public.votes (bout_id, phase, side, option_idx) values (bid, 'before', 'A', 0);
    raise exception 'FALLA: voto duplicado';
  exception when unique_violation then null;
  end;
  -- No puede votar la fase del giro mientras está abierta la primera.
  begin
    insert into public.votes (bout_id, phase, side, option_idx) values (bid, 'after_twist', 'A', 0);
    raise exception 'FALLA: voto de giro con la fase 1 abierta';
  exception when insufficient_privilege then null;
  end;
  -- Ve el conteo agregado.
  select coalesce(sum(votes), 0) into n from public.vote_counts where bout_id = bid;
  perform pg_temp.expect(n = 2, 'vote_counts: ' || n);

  -- Un intruso (sin unirse) no ve ni vota.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000c1', true);
  select count(*) into n from public.bouts;
  perform pg_temp.expect(n = 0, 'el intruso ve robatallas');
  begin
    insert into public.votes (bout_id, phase, side, option_idx) values (bid, 'before', 'A', 0);
    raise exception 'FALLA: el intruso votó';
  exception when insufficient_privilege then null;
  end;

  -- Profesor revela y gira: se cierra la fase 1 y se abre la 2.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', false);
  update public.bouts set status = 'twisted' where id = bid;
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000b1', true);
  begin
    insert into public.votes (bout_id, phase, side, option_idx) values (bid, 'before', 'B', 0);
    raise exception 'FALLA: voto de fase 1 después del giro';
  exception when insufficient_privilege then null;
  end;
  insert into public.votes (bout_id, phase, side, option_idx) values (bid, 'after_twist', 'A', 0), (bid, 'after_twist', 'B', 0);

  -- Revelado tras el giro: ya no se vota.
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', false);
  update public.bouts set status = 'twist_revealed', result = '{"after_twist":{}}' where id = bid;
  perform pg_temp.as_user('00000000-0000-4000-8000-0000000000b1', true);
  select count(*) into n from public.bouts where id = bid and result ? 'after_twist';
  perform pg_temp.expect(n = 1, 'el estudiante no ve el resultado guardado');
end $$;

reset role;
select 'Arena: todas las pruebas pasaron' as resultado;

rollback;
