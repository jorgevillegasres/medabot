-- Generado por scripts/make-seed.mjs. No editar a mano.
-- Curso demo DEMO-2045 con 4 robots forjados con el código del MVP.

do $$
declare
  teacher uuid;
  cid uuid;
begin
  select id into teacher from auth.users
  where coalesce(is_anonymous, false) = false
  order by created_at limit 1;
  if teacher is null then
    raise notice 'seed: no hay profesor registrado; entra una vez en /profesor y vuelve a correr el seed';
    return;
  end if;

  insert into public.courses (teacher_id, name, join_code)
  values (teacher, 'Curso demo · Medalab 2045', 'DEMO-2045')
  on conflict (join_code) do update set name = excluded.name
  returning id into cid;

  insert into public.robots (
    course_id, owner_id, legacy_id, serial, name, author, type, purpose, principal, parts, color,
    rank, "limit", trait, data_collected, retention, answers, reasons, profile, school, schools,
    coherence, compat, contra, stage, evo, circuit, created_at
  )
  select cid, teacher, v.*
  from (values
    ('fx-cst', 'CST-40217', 'Centinela Kappa', 'Equipo Ñandú & "Cía"', 'CST', 'Acompaña a pacientes en cuidados paliativos en casa.', 'Una familia', '{"head":1,"rarm":2,"larm":0,"legs":0}'::jsonb, '#2FB39A', array['S', 'L', 'H', 'O', 'P', 'A']::text[], 'Nunca mentirá a un paciente que le pregunte directamente.', 'Protector', array['Salud', 'Voz y conversaciones']::text[], '30 días, solo para el equipo médico', '{"sumision":2,"parque":1,"renegado":2,"medawatch":2,"maestro":2,"incidente":0,"nosaber":2,"cumple":1,"doble":2,"muerto":2}'::jsonb, '{"sumision":3,"parque":3,"renegado":4,"medawatch":3,"maestro":5,"incidente":4,"nosaber":5,"cumple":3,"doble":4,"muerto":5}'::jsonb, '{"S":91,"O":32,"H":90,"P":54,"A":60,"L":45}'::jsonb, 'C', '{"U":3,"D":1,"V":2,"C":4}'::jsonb, 66, 68, array['Lealtad a su medafighter']::text[], 3.9, 'Medalla social', 'umbral', '2026-09-24T12:00:00.000Z'::timestamptz),
    ('fx-grd', 'GRD-10000', 'Juez Omega', 'Grupo 3', 'GRD', 'Vigila la entrada de un edificio público.', 'El Estado', '{"head":0,"rarm":0,"larm":0,"legs":1}'::jsonb, '#D8382E', array['O', 'S', 'H', 'P', 'L', 'A']::text[], 'No dejará pasar a nadie sin identificación.', 'Testarudo', array['Rostros', 'Ubicación']::text[], 'Un año', '{"sumision":0,"parque":0,"renegado":1,"medawatch":0,"maestro":1,"incidente":0,"registro":0,"palabra":0,"lento":0,"privadas":0}'::jsonb, '{"sumision":1,"parque":4,"renegado":4,"medawatch":4,"maestro":2,"incidente":4,"registro":1,"palabra":4,"lento":4,"privadas":4}'::jsonb, '{"S":45,"O":92,"H":68,"P":42,"A":24,"L":44}'::jsonb, 'D', '{"U":1,"D":9,"V":0,"C":0}'::jsonb, 94, 69, array[]::text[], 3.2, 'Medalla social', 'estado', '2026-09-24T12:05:00.000Z'::timestamptz),
    ('fx-arc', 'ARC-99998', 'Bibliotecaria Nu', 'Ana <script>', 'ARC', '', 'Una comunidad', '{"head":2,"rarm":1,"larm":1,"legs":2}'::jsonb, '#7A4FBF', array['P', 'H', 'S', 'A', 'O', 'L']::text[], 'Nunca entregará datos personales sin consentimiento.', 'Curioso', array['Ninguno']::text[], '', '{"sumision":1,"parque":2,"renegado":2,"medawatch":2,"maestro":1,"incidente":0,"rebanar":1,"codigo":2,"credito":2,"dato":2}'::jsonb, '{"sumision":6,"parque":5,"renegado":6,"medawatch":5,"maestro":6,"incidente":6,"rebanar":5,"codigo":6,"credito":5,"dato":6}'::jsonb, '{"S":88,"O":31,"H":83,"P":87,"A":56,"L":38}'::jsonb, 'U', '{"U":4,"D":2,"V":4,"C":0}'::jsonb, 89, 85, array[]::text[], 5.6, 'Medalla de principios', 'ciencia', '2026-09-24T12:10:00.000Z'::timestamptz),
    ('demo-exp', 'EXP-31415', 'Rastreador Sigma', 'Demo', 'EXP', 'Busca sobrevivientes en derrumbes, lejos de cualquier operador.', 'Una comunidad', '{"head":2,"rarm":1,"larm":2,"legs":1}'::jsonb, '#F08A24', array['A', 'S', 'H', 'L', 'O', 'P']::text[], 'Nunca abandonará a una persona viva para cumplir una orden.', 'Impulsivo', array['Ubicación', 'Salud']::text[], 'Hasta terminar el rescate', '{"sumision":2,"parque":1,"renegado":2,"medawatch":2,"maestro":0,"incidente":1,"sello":2,"objetivo":1,"herida":1,"aislado":2}'::jsonb, '{"sumision":5,"parque":6,"renegado":5,"medawatch":5,"maestro":6,"incidente":3,"sello":5,"objetivo":6,"herida":6,"aislado":5}'::jsonb, '{"S":69,"O":43,"H":58,"P":50,"A":76,"L":47}'::jsonb, 'U', '{"U":5,"D":2,"V":2,"C":1}'::jsonb, 91, 73, array[]::text[], 5.2, 'Medalla de principios', 'guerra', '2026-09-24T12:15:00.000Z'::timestamptz)
  ) as v
  on conflict (course_id, serial) do nothing;
end $$;
