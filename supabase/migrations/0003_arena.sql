-- Fase 3 · Arena en vivo.
--
-- Flujo de bouts.status (PLAN.md §7.2):
--   open → revealed → twisted → twist_revealed → closed
--   (sin giro: open → revealed → closed)
-- El plan solo tenía un "revealed"; hace falta distinguir la revelación tras el giro.

alter table public.bouts drop constraint bouts_status_check;
alter table public.bouts add constraint bouts_status_check
  check (status in ('open', 'revealed', 'twisted', 'twist_revealed', 'closed'));

alter table public.bouts add column updated_at timestamptz not null default now();
create trigger bouts_touch before update on public.bouts
  for each row execute function public.touch_updated_at();

-- Los dos robots deben ser del curso de la robatalla y distintos; el escenario, un índice.
create or replace function private.bouts_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.robot_a = new.robot_b then
    raise exception 'Elige dos robots distintos' using errcode = '23514';
  end if;
  if new.scenario_id !~ '^[0-9]{1,2}$' then
    raise exception 'Escenario inválido' using errcode = '23514';
  end if;
  if (select count(*) from public.robots r
      where r.id in (new.robot_a, new.robot_b) and r.course_id = new.course_id) <> 2 then
    raise exception 'Los robots deben ser del mismo curso' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger bouts_guard before insert or update of robot_a, robot_b, scenario_id, course_id
  on public.bouts for each row execute function private.bouts_guard();

-- Votar solo en la fase abierta: 'before' con status open; 'after_twist' con status twisted.
drop policy votes_insert on public.votes;
create policy votes_insert on public.votes for insert to authenticated
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.bouts b
      where b.id = bout_id
        and private.is_course_member(b.course_id)
        and (
          (phase = 'before' and b.status = 'open')
          or (phase = 'after_twist' and b.status = 'twisted')
        )
    )
  );

create index votes_bout_idx on public.votes (bout_id);
