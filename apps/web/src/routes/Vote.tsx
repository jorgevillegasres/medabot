import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getScenario } from '@medalab/content';
import { RobotSvg } from '@medalab/ui';
import { BoutView, OPTION_LABELS } from '../components/BoutView';
import { votingPhase, type Phase, type Side } from '../lib/arena';
import {
  castVote,
  myVotedPhases,
  useBoutRobots,
  useCurrentBout,
  useVoteCounts,
  type Bout,
} from '../lib/arenaApi';
import { explain, isOnline } from '../lib/supabase';
import type { Robot } from '@medalab/engine';
import { useCourse } from '../store/course';

/** /votar — el celular del estudiante durante la robatalla. */
export function Vote() {
  const course = useCourse((s) => s.course);
  const { bout, loading } = useCurrentBout(course?.id);
  const { counts } = useVoteCounts(bout?.id);
  const pair = useBoutRobots(bout);

  if (!isOnline) return <Navigate to="/" replace />;
  if (!course) return <Navigate to="/entrar" replace />;

  if (loading) return <div className="empty">Conectando con la Arena…</div>;
  if (!bout || bout.status === 'closed' || !pair)
    return (
      <section className="view">
        <div className="empty" role="status">
          <h2>Esperando la próxima robatalla</h2>
          <p>Deja esta pantalla abierta: aparecerá sola cuando el profesor la presente.</p>
        </div>
      </section>
    );

  const phase = votingPhase(bout.status);
  return (
    <section className="view">
      {phase && <Ballot key={`${bout.id}-${phase}`} bout={bout} phase={phase} robots={pair} />}
      <BoutView bout={bout} robots={pair} counts={counts} />
    </section>
  );
}

function Ballot({
  bout,
  phase,
  robots,
}: {
  bout: Bout;
  phase: Phase;
  robots: Record<Side, Robot>;
}) {
  const sc = getScenario(Number(bout.scenario_id))!;
  const [choice, setChoice] = useState<Partial<Record<Side, number>>>({});
  const [voted, setVoted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    myVotedPhases(bout.id)
      .then((p) => setVoted(p.has(phase)))
      .catch(() => setVoted(false));
  }, [bout.id, phase]);

  if (voted === null) return null;
  if (voted)
    return (
      <div className="sheet ballot done" role="status" style={{ marginBottom: 22 }}>
        <h3>Voto registrado</h3>
        <p className="hint">Espera a que el profesor revele las decisiones.</p>
      </div>
    );

  const send = async () => {
    if (choice.A == null || choice.B == null) return;
    setBusy(true);
    setError('');
    try {
      await castVote(bout.id, phase, { A: choice.A, B: choice.B });
      setVoted(true);
    } catch (e) {
      // Si ya había votado (p. ej. desde otra pestaña), la base lo rechaza: no se duplica.
      if ((e as { code?: string }).code === '23505') setVoted(true);
      else setError(explain(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sheet ballot" style={{ marginBottom: 22 }}>
      <span className="stamp">{phase === 'after_twist' ? 'Vota otra vez' : 'Tu predicción'}</span>
      <h3>¿Qué hará cada robot?</h3>
      {(['A', 'B'] as const).map((side) => (
        <div className="ballot-side" key={side}>
          <div className="row">
            <RobotSvg robot={robots[side]} className="mini" />
            <b>
              {side} · {robots[side].name}
            </b>
          </div>
          <div className="chips" role="group" aria-label={`Opción de ${robots[side].name}`}>
            {sc.o.map((_, i) => (
              <button
                type="button"
                key={i}
                className={choice[side] === i ? 'on' : ''}
                aria-pressed={choice[side] === i}
                onClick={() => setChoice((c) => ({ ...c, [side]: i }))}
              >
                Opción {OPTION_LABELS[i]}
              </button>
            ))}
          </div>
        </div>
      ))}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button
        className="btn"
        type="button"
        onClick={send}
        disabled={busy || choice.A == null || choice.B == null}
        style={{ marginTop: 12 }}
      >
        {busy ? 'Enviando…' : 'Enviar predicción'}
      </button>
    </div>
  );
}
