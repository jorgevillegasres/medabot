-- Endurecimiento según los advisors de seguridad de Supabase.
--
-- 1. Las funciones auxiliares de RLS (security definer) no deben quedar expuestas como
--    /rest/v1/rpc/*: se mueven a un esquema "private" que la API no publica. Las políticas
--    las referencian por OID, así que siguen funcionando sin cambios.
-- 2. search_path fijo en las funciones que no lo tenían.
-- join_course sigue en public a propósito: es la RPC con la que el estudiante entra al curso.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_course_teacher(uuid) set schema private;
alter function public.is_course_member(uuid) set schema private;
alter function public.gallery_open(uuid) set schema private;
alter function public.is_teacher_account() set schema private;

revoke all on function private.is_course_teacher(uuid) from public, anon;
revoke all on function private.is_course_member(uuid) from public, anon;
revoke all on function private.gallery_open(uuid) from public, anon;
revoke all on function private.is_teacher_account() from public, anon;
grant execute on function private.is_course_teacher(uuid) to authenticated;
grant execute on function private.is_course_member(uuid) to authenticated;
grant execute on function private.gallery_open(uuid) to authenticated;
grant execute on function private.is_teacher_account() to authenticated;

alter function private.is_teacher_account() set search_path = '';
alter function public.touch_updated_at() set search_path = '';
alter function public.robots_guard() set search_path = '';

-- gen_join_code solo se usa como default de courses.join_code.
revoke all on function public.gen_join_code() from public, anon;
grant execute on function public.gen_join_code() to authenticated;
