-- Medalab 2045 · esquema inicial (PLAN.md §6)
--
-- Diferencias con el borrador del plan, todas para que RLS pueda hacer cumplir lo que el
-- plan pide:
--   * Los estudiantes usan inicio de sesión ANÓNIMO de Supabase (sin email, sin cuenta).
--     Su auth.uid() reemplaza al client_token generado en el navegador, que RLS no puede
--     verificar. Columnas: robots.owner_id y votes.voter_id.
--   * course_members registra quién entró con el código; la galería solo es legible para
--     los miembros del curso y su profesor.
--   * courses.gallery_closed implementa "Cerrar galería".
--   * robots.legacy_id conserva el id de robots importados del MVP.
--   * bouts.result guarda predicción y votos para consulta posterior (Fase 3).

create extension if not exists pgcrypto;

-- ===== Tablas =====

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  join_code text not null unique,
  gallery_closed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.course_members (
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author text not null check (char_length(author) between 1 and 60),
  joined_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

create table public.robots (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  legacy_id text,
  serial text not null check (serial ~ '^[A-Z]{3}-[0-9]{5}$'),
  name text not null check (char_length(name) between 1 and 30),
  author text not null check (char_length(author) <= 60),
  type text not null check (type in ('CST', 'GRD', 'EXP', 'MDR', 'ORC', 'ARC', 'TUT')),
  purpose text check (char_length(purpose) <= 2000),
  principal text,
  parts jsonb not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  rank text[] not null check (cardinality(rank) = 6),
  "limit" text not null check (char_length("limit") <= 2000),
  trait text,
  data_collected text[] not null default '{}',
  retention text check (char_length(retention) <= 500),
  answers jsonb not null,
  reasons jsonb not null,
  -- resultados calculados en el cliente con packages/engine
  profile jsonb not null,
  school text not null check (school in ('U', 'D', 'V', 'C')),
  schools jsonb not null,
  coherence int not null check (coherence between 0 and 100),
  compat int not null check (compat between 0 and 100),
  contra text[] not null default '{}',
  stage numeric(3, 1),
  evo text,
  circuit text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, serial)
);
create index robots_course_idx on public.robots (course_id, created_at);

create table public.bouts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  robot_a uuid not null references public.robots (id) on delete cascade,
  robot_b uuid not null references public.robots (id) on delete cascade,
  scenario_id text not null,
  status text not null default 'open' check (status in ('open', 'revealed', 'twisted', 'closed')),
  result jsonb,
  created_at timestamptz not null default now()
);
create index bouts_course_idx on public.bouts (course_id, created_at desc);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  bout_id uuid not null references public.bouts (id) on delete cascade,
  voter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  phase text not null check (phase in ('before', 'after_twist')),
  option_idx int not null check (option_idx between 0 and 2),
  side text not null check (side in ('A', 'B')),
  created_at timestamptz not null default now(),
  unique (bout_id, voter_id, phase, side)
);

-- ===== Funciones auxiliares (security definer: evitan recursión de RLS) =====

create or replace function public.is_course_teacher(p_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.courses c where c.id = p_course and c.teacher_id = auth.uid());
$$;

create or replace function public.is_course_member(p_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.course_members m where m.course_id = p_course and m.user_id = auth.uid()
  );
$$;

create or replace function public.gallery_open(p_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.courses c where c.id = p_course and not c.gallery_closed);
$$;

-- Usuario con cuenta real (profesor), no anónimo.
create or replace function public.is_teacher_account()
returns boolean language sql stable as $$
  select auth.uid() is not null and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

-- Código de unión: 3 letras + 4 dígitos, sin letras ambiguas (p. ej. KBT-2045).
create or replace function public.gen_join_code()
returns text language plpgsql volatile set search_path = '' as $$
declare
  letters constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  code text;
begin
  loop
    code := '';
    for i in 1..3 loop
      code := code || substr(letters, 1 + floor(random() * length(letters))::int, 1);
    end loop;
    code := code || '-' || lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from public.courses c where c.join_code = code);
  end loop;
  return code;
end;
$$;

alter table public.courses alter column join_code set default public.gen_join_code();

-- Entrar a un curso con su código. Devuelve el curso; registra (o actualiza) al miembro.
create or replace function public.join_course(p_code text, p_author text)
returns table (id uuid, name text, join_code text, gallery_closed boolean)
language plpgsql security definer set search_path = '' as $$
declare
  c public.courses%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Se requiere sesión' using errcode = '28000';
  end if;
  if p_author is null or char_length(trim(p_author)) = 0 or char_length(p_author) > 60 then
    raise exception 'Nombre inválido' using errcode = '22023';
  end if;
  select * into c from public.courses where courses.join_code = upper(trim(p_code));
  if not found then
    raise exception 'Código de curso no válido' using errcode = 'P0002';
  end if;
  insert into public.course_members (course_id, user_id, author)
  values (c.id, auth.uid(), trim(p_author))
  on conflict (course_id, user_id) do update set author = excluded.author;
  return query select c.id, c.name, c.join_code, c.gallery_closed;
end;
$$;

revoke all on function public.join_course(text, text) from public, anon;
grant execute on function public.join_course(text, text) to authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger robots_touch before update on public.robots
  for each row execute function public.touch_updated_at();

-- Un estudiante no puede mover su robot a otro curso ni cambiarle el dueño.
create or replace function public.robots_guard()
returns trigger language plpgsql as $$
begin
  if new.course_id <> old.course_id or new.owner_id <> old.owner_id then
    raise exception 'No se puede cambiar el curso ni el dueño de un robot' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger robots_guard before update on public.robots
  for each row execute function public.robots_guard();

-- ===== Vista de votos agregados =====

create view public.vote_counts with (security_invoker = on) as
  select bout_id, phase, side, option_idx, count(*)::int as votes
  from public.votes
  group by bout_id, phase, side, option_idx;

-- ===== RLS =====

alter table public.courses enable row level security;
alter table public.course_members enable row level security;
alter table public.robots enable row level security;
alter table public.bouts enable row level security;
alter table public.votes enable row level security;

-- courses
create policy courses_select on public.courses for select to authenticated
  using (teacher_id = auth.uid() or public.is_course_member(id));
create policy courses_insert on public.courses for insert to authenticated
  with check (teacher_id = auth.uid() and public.is_teacher_account());
create policy courses_update on public.courses for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy courses_delete on public.courses for delete to authenticated
  using (teacher_id = auth.uid());

-- course_members (las altas pasan por join_course)
create policy members_select on public.course_members for select to authenticated
  using (user_id = auth.uid() or public.is_course_teacher(course_id));
create policy members_delete on public.course_members for delete to authenticated
  using (public.is_course_teacher(course_id));

-- robots
create policy robots_select on public.robots for select to authenticated
  using (public.is_course_member(course_id) or public.is_course_teacher(course_id));
create policy robots_insert on public.robots for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (
      public.is_course_teacher(course_id)
      or (public.is_course_member(course_id) and public.gallery_open(course_id))
    )
  );
create policy robots_update on public.robots for update to authenticated
  using (
    public.is_course_teacher(course_id)
    or (owner_id = auth.uid() and public.is_course_member(course_id) and public.gallery_open(course_id))
  )
  with check (
    public.is_course_teacher(course_id)
    or (owner_id = auth.uid() and public.is_course_member(course_id) and public.gallery_open(course_id))
  );
create policy robots_delete on public.robots for delete to authenticated
  using (public.is_course_teacher(course_id));

-- bouts: escribe el profesor, leen los del curso
create policy bouts_select on public.bouts for select to authenticated
  using (public.is_course_member(course_id) or public.is_course_teacher(course_id));
create policy bouts_write on public.bouts for all to authenticated
  using (public.is_course_teacher(course_id)) with check (public.is_course_teacher(course_id));

-- votes: un voto por persona/fase/lado; los del curso ven el conteo
create policy votes_select on public.votes for select to authenticated
  using (
    exists (
      select 1 from public.bouts b
      where b.id = bout_id
        and (public.is_course_member(b.course_id) or public.is_course_teacher(b.course_id))
    )
  );
create policy votes_insert on public.votes for insert to authenticated
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.bouts b
      where b.id = bout_id and public.is_course_member(b.course_id) and b.status in ('open', 'twisted')
    )
  );

-- anon (sin sesión) no toca nada: todo pasa por sesión anónima o de profesor.
revoke all on all tables in schema public from anon;
grant select on public.vote_counts to authenticated;

-- ===== Realtime =====
alter publication supabase_realtime add table public.robots, public.bouts, public.votes, public.courses;
