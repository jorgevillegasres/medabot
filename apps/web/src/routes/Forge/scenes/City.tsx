import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AXES, CIRCUITS, REASONS, type AxisKey } from '@medalab/content';
import { Chips } from '../../../components/Chips';
import { CORPORATION, placeOf } from '../../../game/city';
import { cityState } from '../../../game/progress';
import { dominantAxis } from '../../../game/reaction';
import { PAUSE_QUESTIONS, REVIEW_QUESTIONS, circuitQuestion } from '../../../game/referee';
import { citySteps, firstOpenStep, firstPendingStep } from '../../../game/wizard';
import { useDraft } from '../../../store/draft';
import { useGame } from '../../../store/game';
import { useFinishForge } from '../useFinishForge';
import { MiniMedal } from './art/MiniMedal';
import { Silhouette } from './art/Silhouette';
import { CityTrail } from './CityTrail';
import { useDialog } from './useDialog';
import { Referee, StepScreen, WizardNav } from './Wizard';

const REASON_ITEMS = REASONS.map((r) => ({ value: r.s, label: r.x }));
const axisName = (k: AxisKey) => AXES.find((a) => a.k === k)!.n;

/** Acto 3 · Ciudad 2045, paso a paso: los 10 dilemas, cada uno con decisión y motivo. */
export function City() {
  const { draft, answer, reason } = useDraft();
  const stored = useGame((s) => s.cityStep);
  const setCityStep = useGame((s) => s.setCityStep);
  const finish = useFinishForge();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<{ axis: AxisKey; at: number } | null>(null);
  const [gate, setGate] = useState(false);
  /** true tras «Cambiar» en la revisión: al terminar ese dilema se vuelve a la revisión. */
  const [fromReview, setFromReview] = useState(false);

  const city = cityState(draft);
  const steps = citySteps(draft.type);
  // Nunca más allá del primer paso pendiente (p. ej. si cambió el tipo de robot).
  const i = stored == null ? firstOpenStep(draft) : Math.min(stored, firstPendingStep(draft));
  const step = steps[i];
  const go = (n: number) => setCityStep(Math.max(0, Math.min(n, steps.length - 1)));

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2400);
    return () => clearTimeout(t);
  }, [flash]);

  const current = step.kind === 'decide' || step.kind === 'reason' ? step.index : null;
  const d = current != null && 'dilemma' in step ? step.dilemma : null;
  const chosen = d ? draft.answers[d.id] : undefined;
  const why = d ? draft.reasons[d.id] : undefined;

  const canNext =
    step.kind === 'decide' ? chosen != null : step.kind === 'reason' ? why != null : true;
  const backToReview = fromReview && step.kind === 'reason';
  const nextLabel =
    step.kind === 'intro'
      ? 'Empezar'
      : step.kind === 'unlock'
        ? 'Entrar al circuito'
        : step.kind === 'review'
          ? `Entrar a la ${CORPORATION.name}`
          : backToReview
            ? 'Volver a la revisión'
            : 'Siguiente';
  const next = () => {
    if (step.kind === 'review') return setGate(true);
    if (backToReview) {
      setFromReview(false);
      return go(steps.length - 1);
    }
    go(i + 1);
  };

  return (
    <div className="scene city wizard">
      <h2 className="act-stamp">Acto 3 · Ciudad 2045</h2>
      <header className="city-hud">
        <b>{draft.name}</b>
        <span>
          Encuentros {city.solved}/{city.total}
        </span>
        <MiniMedal
          color={draft.color}
          flash={flash ? axisName(flash.axis) : null}
          flashKey={flash?.at}
        />
      </header>
      <CityTrail city={city} current={current} robot={draft} />

      {step.kind === 'intro' && (
        <StepScreen stepKey="intro" title="Bienvenido a Ciudad 2045">
          <div className="lore">
            <p>
              Tu robot va a enfrentar 10 situaciones: 6 en la Plaza {placeOf('core').name} y 4 en el
              circuito de su tipo, {placeOf(city.district.key).name}.
            </p>
          </div>
          <Referee>
            Responde como la medalla, no como tú. Cada decisión pide también un motivo. Si ninguna
            opción te convence, elige la más cercana y guarda tu otra salida para la discusión en
            clase.
          </Referee>
        </StepScreen>
      )}

      {d && (
        <div className="sheet encounter-step" data-dilemma={d.id} data-index={current}>
          <div className="cartel">
            <span>
              {current! + 1}/{city.total} ·{' '}
              {d.c === 'core' ? `Plaza ${CIRCUITS.core.n}` : `Circuito ${CIRCUITS[d.c].n}`}
            </span>
          </div>
          {step.kind === 'decide' ? (
            <StepScreen stepKey={`decide-${d.id}`} title={d.t}>
              <div className="panel-scene">
                <Silhouette color={placeOf(d.c).color} />
                <p className="bubble">{d.s}</p>
              </div>
              <Referee label="Antes de decidir" questions={PAUSE_QUESTIONS} />
              <p className="question">¿Qué hace tu robot?</p>
              {d.o.map((o, j) => (
                <button
                  type="button"
                  key={j}
                  className={chosen === j ? 'action-card on' : 'action-card'}
                  aria-pressed={chosen === j}
                  onClick={() => answer(d.id, j)}
                >
                  {o.x}
                </button>
              ))}
            </StepScreen>
          ) : (
            <StepScreen stepKey={`reason-${d.id}`} title="¿Por qué lo hace?">
              <p className="hint">Tu robot decidió:</p>
              <blockquote className="chosen">{chosen != null && d.o[chosen].x}</blockquote>
              <div className="why">
                <Chips
                  small
                  label="¿Por qué lo hace?"
                  items={REASON_ITEMS}
                  isOn={(s) => why === s}
                  onPick={(s) => {
                    const first = why == null;
                    reason(d.id, s);
                    if (first && chosen != null)
                      setFlash({ axis: dominantAxis(d.o[chosen]), at: Date.now() });
                  }}
                />
              </div>
              {why != null && chosen != null && (
                <div className="reaction" role="status">
                  <span className="spark-axis">✦ {axisName(dominantAxis(d.o[chosen]))}</span>
                  <span className="stamp-solved">Resuelto</span>
                </div>
              )}
              {why != null && (
                <Referee>{circuitQuestion(d.c, d.c === 'core' ? current! : current! - 6)}</Referee>
              )}
            </StepScreen>
          )}
        </div>
      )}

      {step.kind === 'unlock' && (
        <div className="sheet unlock-step">
          <span className="stamp">¡Nuevo circuito!</span>
          <StepScreen stepKey="unlock" title={`Se abrió el circuito ${placeOf(step.circuit).name}`}>
            <div className="lore">
              <p>{placeOf(step.circuit).description}</p>
            </div>
          </StepScreen>
        </div>
      )}

      {step.kind === 'review' && (
        <StepScreen stepKey="review" title="Revisa tus decisiones">
          <p className="hint">
            Puedes cambiar cualquiera antes de grabar la medalla. Después ya no.
          </p>
          <ol className="review-list">
            {steps.flatMap((s, j) =>
              s.kind === 'decide'
                ? [
                    <li key={s.dilemma.id}>
                      <div>
                        <b>
                          {s.index + 1}. {s.dilemma.t}
                        </b>
                        <span>{s.dilemma.o[draft.answers[s.dilemma.id] ?? 0].x}</span>
                      </div>
                      <button
                        type="button"
                        className="btn small alt"
                        aria-label={`Cambiar: ${s.dilemma.t}`}
                        onClick={() => {
                          setFromReview(true);
                          go(j);
                        }}
                      >
                        Cambiar
                      </button>
                    </li>,
                  ]
                : [],
            )}
          </ol>
          <Referee questions={REVIEW_QUESTIONS} />
        </StepScreen>
      )}

      <WizardNav
        backLabel={i === 0 ? 'Volver al yunque' : 'Atrás'}
        onBack={() => (i === 0 ? navigate('/forja/2') : go(i - 1))}
        onNext={next}
        nextLabel={nextLabel}
        canNext={canNext}
      />

      {gate && <CorporationGate onEnter={finish} onCancel={() => setGate(false)} />}
    </div>
  );
}

function CorporationGate({ onEnter, onCancel }: { onEnter: () => void; onCancel: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  useDialog(dialogRef, onCancel, enterRef);
  return (
    <div className="dialog-backdrop">
      <div
        ref={dialogRef}
        className="sheet gate"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
      >
        <span className="stamp">{CORPORATION.name}</span>
        <h2 id="gate-title">¿Grabar la medalla?</h2>
        <p>Al entrar, la medalla se graba con tus respuestas y ya no podrás cambiarlas.</p>
        <div className="row">
          <button
            ref={enterRef}
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              onEnter();
            }}
          >
            Grabar la medalla
          </button>
          <button type="button" className="btn alt" onClick={onCancel}>
            Todavía no
          </button>
        </div>
      </div>
    </div>
  );
}
