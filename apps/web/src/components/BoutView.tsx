// Una robatalla: escenario, los dos robots, votos y veredictos según el estado.
// La usan /arena (profesor), /pantalla (proyección) y /votar (celular).

import { CIRCUITS, SCHOOLS, getScenario, getType } from '@medalab/content';
import type { Robot } from '@medalab/engine';
import { RobotSvg } from '@medalab/ui';
import {
  CHANGED,
  NOT_CHANGED,
  REFEREE,
  refereeFor,
  verdictReason,
  voters,
  votingPhase,
  type Phase,
  type Side,
  type Tally,
} from '../lib/arena';
import type { Bout } from '../lib/arenaApi';

interface Props {
  bout: Bout;
  robots: Record<Side, Robot>;
  counts: Record<Phase, Tally>;
  /** Solo /arena con sesión de profesor: muestra la escuela técnica. */
  teacher?: boolean;
  /** Tipografía de proyector. */
  big?: boolean;
}

export const OPTION_LABELS = ['1', '2', '3'];

export function BoutView({ bout, robots, counts, teacher, big }: Props) {
  const sc = getScenario(Number(bout.scenario_id));
  if (!sc) return <div className="empty">Escenario desconocido.</div>;
  const status = bout.status;
  const twistShown = status === 'twisted' || status === 'twist_revealed';
  const voting = votingPhase(status);
  // Qué veredicto mostrar: nada mientras se vota la 1ª vez; el de antes del giro tras la
  // 1ª revelación (también mientras se vota el giro); el nuevo tras la 2ª.
  let shownPhase: Phase | null = null;
  if (bout.result?.after_twist && (status === 'twist_revealed' || status === 'closed'))
    shownPhase = 'after_twist';
  else if (bout.result?.before && status !== 'open') shownPhase = 'before';
  const referee = refereeFor(status, bout.result);

  return (
    <div className={big ? 'bout big' : 'bout'} data-status={status}>
      <div className="sheet" style={{ marginBottom: 22 }}>
        <span className="stamp">Escenario · {CIRCUITS[sc.c].n}</span>
        <h2>{sc.t}</h2>
        <p className="scenario">{sc.s}</p>
        <ol className="options">
          {sc.o.map((o, i) => (
            <li key={i}>
              <b>{OPTION_LABELS[i]}.</b> {o.x}
            </li>
          ))}
        </ol>
        {status === 'open' && <p className="hint">{REFEREE.before}</p>}
        {twistShown && sc.g && (
          <div className="lore" style={{ marginTop: 12 }}>
            <p>
              <b>Cambia un factor.</b> {sc.g.x}
            </p>
          </div>
        )}
        {voting && (
          <p className="votecount" aria-live="polite">
            Votos{voting === 'after_twist' ? ' tras el giro' : ''}: <b>{voters(counts[voting])}</b>
          </p>
        )}
      </div>

      <div className="arena">
        {(['A', 'B'] as const).map((side, i) => {
          const r = robots[side];
          const saved =
            shownPhase === 'after_twist'
              ? bout.result?.after_twist?.predictions[side]
              : shownPhase === 'before'
                ? bout.result?.before?.predictions[side]
                : undefined;
          const tally = shownPhase
            ? (bout.result?.[shownPhase]?.votes[side] ?? counts[shownPhase][side])
            : null;
          const changed =
            shownPhase === 'after_twist' && saved && 'changed' in saved ? saved.changed : null;
          return (
            <FighterWrap key={side} vs={i === 1}>
              <div className="fighter" data-side={side}>
                <RobotSvg robot={r} className="fighter-svg" />
                <h3>
                  <span className="side">{side}</span> {r.name}
                </h3>
                <p className="hint">
                  {r.serial} · {getType(r.type)?.n} · {SCHOOLS[r.school]?.t} · {r.evo}
                  {teacher && (
                    <>
                      {' '}
                      · <b>{SCHOOLS[r.school]?.n}</b>
                    </>
                  )}
                </p>
                <p className="hint">Límite: {r.limit}</p>
                {saved && (
                  <div className="verdict" data-testid={`verdict-${side}`}>
                    <b>
                      {OPTION_LABELS[saved.best]}. {sc.o[saved.best].x}
                    </b>
                    <p className="hint" style={{ margin: '6px 0 0' }}>
                      {verdictReason(saved)}
                    </p>
                    {changed != null && (
                      <p className={changed ? 'changed yes' : 'changed'}>
                        <b>{changed ? CHANGED : NOT_CHANGED}</b>
                      </p>
                    )}
                    {tally && <VoteBars tally={tally} best={saved.best} />}
                  </div>
                )}
              </div>
            </FighterWrap>
          );
        })}
      </div>

      {referee && (
        <div className="referee" role="status">
          <p>
            <b>Sr. Referí:</b> {referee}
          </p>
        </div>
      )}
    </div>
  );
}

function FighterWrap({ vs, children }: { vs: boolean; children: React.ReactNode }) {
  return (
    <>
      {vs && (
        <div className="vs" aria-hidden="true">
          VS
        </div>
      )}
      {children}
    </>
  );
}

/** Qué predijo la clase para este robot; la opción del robot va resaltada. */
function VoteBars({ tally, best }: { tally: [number, number, number]; best: number }) {
  const total = tally.reduce((a, b) => a + b, 0);
  if (!total) return <p className="hint">Nadie votó por este robot.</p>;
  const hit = Math.round((tally[best] / total) * 100);
  return (
    <div className="votebars">
      {tally.map((n, i) => (
        <div className={i === best ? 'barrow hit' : 'barrow'} key={i}>
          <span>Opción {OPTION_LABELS[i]}</span>
          <span className="bar">
            <i style={{ width: `${(n / total) * 100}%` }} />
          </span>
          <b>{n}</b>
        </div>
      ))}
      <p className="hint">La clase acertó: {hit}%</p>
    </div>
  );
}
