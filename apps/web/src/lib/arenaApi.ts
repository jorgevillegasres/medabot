// Robatallas y votos en Supabase + suscripciones Realtime.

import { useCallback, useEffect, useState } from 'react';
import type { Robot } from '@medalab/engine';
import { getRobot, currentUserId } from './api';
import { db } from './supabase';
import {
  tallies,
  type BoutResult,
  type BoutStatus,
  type Phase,
  type Side,
  type Tally,
  type VoteCountRow,
} from './arena';

export interface Bout {
  id: string;
  course_id: string;
  robot_a: string;
  robot_b: string;
  scenario_id: string;
  status: BoutStatus;
  result: BoutResult | null;
  created_at: string;
  updated_at: string;
}

async function latestBout(courseId: string): Promise<Bout | null> {
  const { data, error } = await db()
    .from('bouts')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Bout | null;
}

/** Robatalla más reciente del curso, en vivo. */
export function useCurrentBout(courseId: string | null | undefined) {
  const [bout, setBout] = useState<Bout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!courseId) return;
    let alive = true;
    const sb = db();
    const refresh = () =>
      latestBout(courseId)
        .then((b) => alive && setBout(b))
        .catch((e) => alive && setError(e))
        .finally(() => alive && setLoading(false));
    const channel = sb
      .channel(`bouts:${courseId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bouts', filter: `course_id=eq.${courseId}` },
        (payload) => {
          const row = payload.new as Bout | undefined;
          // El evento trae la fila completa; si es la más reciente, se usa directamente.
          setBout((cur) => (row?.id && (!cur || row.created_at >= cur.created_at) ? row : cur));
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refresh();
      });
    return () => {
      alive = false;
      sb.removeChannel(channel);
    };
  }, [courseId]);

  return { bout, loading, error };
}

/** Conteo de votos de una robatalla, en vivo. */
export function useVoteCounts(boutId: string | null | undefined) {
  const [counts, setCounts] = useState<Record<Phase, Tally>>(() => tallies([]));

  const refresh = useCallback(async () => {
    if (!boutId) return;
    const { data, error } = await db().from('vote_counts').select('*').eq('bout_id', boutId);
    if (!error) setCounts(tallies(data as VoteCountRow[]));
  }, [boutId]);

  useEffect(() => {
    if (!boutId) return;
    setCounts(tallies([]));
    const sb = db();
    const channel = sb
      .channel(`votes:${boutId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `bout_id=eq.${boutId}` },
        () => void refresh(),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void refresh();
      });
    return () => {
      sb.removeChannel(channel);
    };
  }, [boutId, refresh]);

  return { counts, refresh };
}

/** Los dos robots de la robatalla. */
export function useBoutRobots(bout: Bout | null) {
  const [robots, setRobots] = useState<Record<Side, Robot> | null>(null);
  const a = bout?.robot_a;
  const b = bout?.robot_b;
  useEffect(() => {
    if (!a || !b) return setRobots(null);
    let alive = true;
    Promise.all([getRobot(a), getRobot(b)]).then(([ra, rb]) => {
      if (alive && ra && rb) setRobots({ A: ra.robot, B: rb.robot });
    });
    return () => {
      alive = false;
    };
  }, [a, b]);
  return robots;
}

// ===== Profesor =====

export async function presentBout(
  courseId: string,
  robotA: string,
  robotB: string,
  scenarioIdx: number,
): Promise<Bout> {
  // Una sola robatalla activa por curso: las anteriores se cierran.
  const { error: e1 } = await db()
    .from('bouts')
    .update({ status: 'closed' })
    .eq('course_id', courseId)
    .neq('status', 'closed');
  if (e1) throw e1;
  const { data, error } = await db()
    .from('bouts')
    .insert({
      course_id: courseId,
      robot_a: robotA,
      robot_b: robotB,
      scenario_id: String(scenarioIdx),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Bout;
}

export async function advanceBout(id: string, status: BoutStatus, result: BoutResult | null) {
  const { data, error } = await db()
    .from('bouts')
    .update({ status, result })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Bout;
}

// ===== Estudiante =====

/** Fases en las que este estudiante ya votó. */
export async function myVotedPhases(boutId: string): Promise<Set<Phase>> {
  const uid = await currentUserId();
  const { data, error } = await db()
    .from('votes')
    .select('phase')
    .eq('bout_id', boutId)
    .eq('voter_id', uid);
  if (error) throw error;
  return new Set((data as { phase: Phase }[]).map((v) => v.phase));
}

/** Registra el voto (qué opción cree que elige cada robot). Un voto por fase. */
export async function castVote(boutId: string, phase: Phase, choice: Record<Side, number>) {
  const { error } = await db()
    .from('votes')
    .insert([
      { bout_id: boutId, phase, side: 'A', option_idx: choice.A },
      { bout_id: boutId, phase, side: 'B', option_idx: choice.B },
    ]);
  if (error) throw error;
}
