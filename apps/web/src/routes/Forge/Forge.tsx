import { lazy, Suspense, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Steps } from '../../components/Steps';
import { useDraft } from '../../store/draft';
import { useGame, type Act } from '../../store/game';
import { useRobot } from '../../store/robots';
import { ResultView } from '../Result';
import { StepBody } from './StepBody';
import { StepMedal } from './StepMedal';
import { StepTest } from './StepTest';
import { SceneBoundary } from './scenes/SceneBoundary';

// Las escenas se cargan bajo demanda: el celular no descarga la Ceremonia en el Taller.
const Workshop = lazy(() => import('./scenes/Workshop').then((m) => ({ default: m.Workshop })));
const Anvil = lazy(() => import('./scenes/Anvil').then((m) => ({ default: m.Anvil })));
const City = lazy(() => import('./scenes/City').then((m) => ({ default: m.City })));
const Ceremony = lazy(() => import('./scenes/Ceremony').then((m) => ({ default: m.Ceremony })));

const GAME_LABELS = ['1 · Taller', '2 · Yunque', '3 · Ciudad', '4 · Ceremonia'];

/** /forja/:step — la forja jugada (por defecto) o la clásica («Ver como formulario»). */
export function Forge() {
  const step = Number(useParams().step);
  const draft = useDraft((s) => s.draft);
  const forgedId = useDraft((s) => s.forgedId);
  const resetDraft = useDraft((s) => s.reset);
  const forged = useRobot(forgedId);
  const classic = useGame((s) => s.classic);
  const setClassic = useGame((s) => s.setClassic);
  const setAct = useGame((s) => s.setAct);
  const resetGame = useGame((s) => s.reset);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const redirect = ![1, 2, 3, 4].includes(step)
    ? '/forja/1'
    : forged && step < 4
      ? '/forja/4' // Tras la Ceremonia la medalla está grabada: los actos 1–3 quedan cerrados.
      : step >= 2 && !draft.name.trim()
        ? '/forja/1'
        : step === 3 && !draft.limit.trim()
          ? '/forja/2'
          : step === 4 && !forged
            ? '/forja/3'
            : null;

  useEffect(() => {
    if (!redirect) setAct(step as Act);
  }, [redirect, step, setAct]);

  if (redirect) return <Navigate to={redirect} replace />;

  const forgeAnother = () => {
    resetDraft();
    resetGame();
    navigate('/forja/1');
  };

  return (
    <section className={classic ? 'view' : 'view game'}>
      <div className="forge-top">
        <Steps current={step} labels={classic ? undefined : GAME_LABELS} />
        <button type="button" className="linkbtn mode-toggle" onClick={() => setClassic(!classic)}>
          {classic ? 'Ver como juego' : 'Ver como formulario'}
        </button>
      </div>
      {classic ? (
        <>
          {step === 1 && <StepBody />}
          {step === 2 && <StepMedal />}
          {step === 3 && <StepTest />}
          {step === 4 && forged && <ResultView robot={forged} onForgeAnother={forgeAnother} />}
        </>
      ) : (
        <SceneBoundary key={step} onClassic={() => setClassic(true)}>
          <Suspense fallback={<div className="empty">Cargando escena…</div>}>
            {step === 1 && <Workshop />}
            {step === 2 && <Anvil />}
            {step === 3 && <City />}
            {step === 4 && forged && <Ceremony robot={forged} onForgeAnother={forgeAnother} />}
          </Suspense>
        </SceneBoundary>
      )}
    </section>
  );
}

/** /forja — retoma la partida en el último acto visitado. */
export function ForgeResume() {
  const act = useGame((s) => s.act);
  return <Navigate to={`/forja/${act}`} replace />;
}
