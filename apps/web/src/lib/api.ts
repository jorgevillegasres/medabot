// Operaciones contra Supabase. Toda la seguridad la imponen las políticas RLS de
// supabase/migrations/0001_init.sql; aquí solo se arman las consultas.

import { useEffect, useState } from 'react';
import { makeSerial, type Robot } from '@medalab/engine';
import { db, ensureStudentSession } from './supabase';
import { robotToInsert, rowToRobot, type RobotRow } from './robotRow';

export interface Course {
  id: string;
  name: string;
  join_code: string;
  gallery_closed: boolean;
  teacher_id?: string;
  created_at?: string;
}

export interface PublishedRobot {
  row: RobotRow;
  robot: Robot;
}

const wrap = (row: RobotRow): PublishedRobot => ({ row, robot: rowToRobot(row) });

export async function joinCourse(code: string, author: string): Promise<Course> {
  await ensureStudentSession();
  const { data, error } = await db().rpc('join_course', { p_code: code, p_author: author });
  if (error) throw error;
  const c = (Array.isArray(data) ? data[0] : data) as Course | undefined;
  if (!c) throw Object.assign(new Error('Código de curso no válido'), { code: 'P0002' });
  return c;
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await db().auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * Publica un robot. La serie debe ser única en el curso: si choca, se genera otra
 * y se reintenta (PLAN.md §5.7). Devuelve la fila creada (con la serie final).
 */
export async function publishRobot(robot: Robot, courseId: string): Promise<PublishedRobot> {
  let candidate = robot;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db()
      .from('robots')
      .insert(robotToInsert(candidate, courseId))
      .select()
      .single();
    if (!error) return wrap(data as RobotRow);
    const serialTaken = error.code === '23505' && /serial/.test(error.message + error.details);
    if (!serialTaken) throw error;
    candidate = { ...candidate, serial: makeSerial(candidate.type) };
  }
  throw new Error('No se pudo asignar un número de serie único.');
}

export async function listRobots(courseId: string): Promise<PublishedRobot[]> {
  const { data, error } = await db()
    .from('robots')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at');
  if (error) throw error;
  return (data as RobotRow[]).map(wrap);
}

export async function getRobot(id: string): Promise<PublishedRobot | null> {
  const { data, error } = await db().from('robots').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? wrap(data as RobotRow) : null;
}

export async function updateRobot(id: string, patch: Partial<RobotRow>) {
  const { data, error } = await db().from('robots').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return wrap(data as RobotRow);
}

export async function deleteRobot(id: string) {
  const { error, count } = await db().from('robots').delete({ count: 'exact' }).eq('id', id);
  if (error) throw error;
  if (!count) throw Object.assign(new Error('Sin permiso para borrar'), { code: '42501' });
}

export async function getCourse(id: string): Promise<Course | null> {
  const { data, error } = await db().from('courses').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Course | null;
}

/**
 * Robots del curso en tiempo real: carga inicial + INSERT/UPDATE/DELETE por Realtime.
 */
export function useCourseRobots(courseId: string | null | undefined) {
  const [robots, setRobots] = useState<PublishedRobot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!courseId) return;
    let alive = true;
    const sb = db();
    setLoading(true);
    const channel = sb
      .channel(`robots:${courseId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'robots', filter: `course_id=eq.${courseId}` },
        (payload) => {
          setRobots((prev) => {
            if (payload.eventType === 'DELETE') {
              const id = (payload.old as { id: string }).id;
              return prev.filter((p) => p.row.id !== id);
            }
            const row = payload.new as RobotRow;
            const next = prev.filter((p) => p.row.id !== row.id);
            next.push(wrap(row));
            return next.sort((a, b) => a.row.created_at.localeCompare(b.row.created_at));
          });
        },
      )
      .subscribe((status) => {
        // Se recarga al (re)conectar para no perder cambios ocurridos sin conexión.
        if (status === 'SUBSCRIBED') {
          listRobots(courseId)
            .then((rs) => alive && setRobots(rs))
            .catch((e) => alive && setError(e))
            .finally(() => alive && setLoading(false));
        }
      });
    return () => {
      alive = false;
      sb.removeChannel(channel);
    };
  }, [courseId]);

  return { robots, loading, error };
}

// ===== Profesor =====

export async function listMyCourses(): Promise<Course[]> {
  const uid = await currentUserId();
  const { data, error } = await db()
    .from('courses')
    .select('*')
    .eq('teacher_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Course[];
}

export async function createCourse(name: string): Promise<Course> {
  // join_code lo genera la base de datos (gen_join_code); si chocara, se reintenta.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await db().from('courses').insert({ name }).select().single();
    if (!error) return data as Course;
    if (error.code !== '23505') throw error;
  }
  throw new Error('No se pudo generar un código de curso único.');
}

export async function setGalleryClosed(courseId: string, closed: boolean): Promise<Course> {
  const { data, error } = await db()
    .from('courses')
    .update({ gallery_closed: closed })
    .eq('id', courseId)
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

/** Importa robots (códigos o JSON del MVP) al curso, con el profesor como dueño. */
export async function importToCourse(robots: Robot[], courseId: string) {
  const ok: PublishedRobot[] = [];
  const failed: { robot: Robot; error: unknown }[] = [];
  for (const r of robots) {
    try {
      ok.push(await publishRobot(r, courseId));
    } catch (error) {
      failed.push({ robot: r, error });
    }
  }
  return { ok, failed };
}
