import { useNavigate } from 'react-router-dom';
import { CIRCUITS, REASONS, circuitFor, getType, testFor } from '@medalab/content';
import { Chips } from '../../components/Chips';
import { isSolved } from '../../game/progress';
import { useDraft } from '../../store/draft';
import { useFinishForge } from './useFinishForge';

const REASON_ITEMS = REASONS.map((r) => ({ value: r.s, label: r.x }));

export function StepTest() {
  const { draft, answer, reason } = useDraft();
  const finishForge = useFinishForge();
  const navigate = useNavigate();

  const list = testFor(draft.type);
  const circ = CIRCUITS[circuitFor(draft.type)];
  const done = list.filter((d) => isSolved(draft, d.id)).length;
  const complete = done === list.length;

  const finish = () => {
    if (complete) finishForge();
  };

  return (
    <div>
      <div className="sheet" style={{ marginBottom: 18 }}>
        <span className="stamp">Test moral</span>
        <h2>Responde como la medalla, no como tú</h2>
        <p>
          Diez situaciones. No elijas lo que harías tú: elige lo que haría el robot que acabas de
          diseñar, con la jerarquía que le diste, y luego di por qué lo hace. Si dudas, esa duda es
          el hallazgo.
        </p>
        <div className="lore">
          <p>
            Tu robot es <b>{getType(draft.type)?.n}</b>: además de las seis pruebas del laboratorio,
            entra al circuito <b>{circ.n}</b>. {circ.d}
          </p>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="Dilemas respondidos"
          aria-valuemin={0}
          aria-valuemax={list.length}
          aria-valuenow={done}
        >
          <i style={{ width: `${(done / list.length) * 100}%` }} />
        </div>
        <p className="hint" style={{ margin: 0 }}>
          {done} de {list.length} respondidos
        </p>
      </div>

      {list.map((d, i) => {
        const a = draft.answers[d.id];
        return (
          <article className="dilema" key={d.id} data-dilemma={d.id}>
            <h3>
              <span>
                {i + 1}/{list.length} · {CIRCUITS[d.c].n}
              </span>
              {d.t}
            </h3>
            <p>{d.s}</p>
            {d.o.map((o, j) => (
              <button
                type="button"
                key={j}
                className={a === j ? 'opt on' : 'opt'}
                aria-pressed={a === j}
                onClick={() => answer(d.id, j)}
              >
                {o.x}
              </button>
            ))}
            {a != null && (
              <div className="why">
                <b>¿Por qué lo hace?</b>
                <Chips
                  small
                  label="¿Por qué lo hace?"
                  items={REASON_ITEMS}
                  isOn={(s) => draft.reasons[d.id] === s}
                  onPick={(s) => reason(d.id, s)}
                />
              </div>
            )}
          </article>
        );
      })}

      <div className="row">
        <button type="button" className="btn alt" onClick={() => navigate('/forja/2')}>
          Volver
        </button>
        <button type="button" className="btn" onClick={finish} disabled={!complete}>
          Grabar la medalla
        </button>
      </div>
    </div>
  );
}
