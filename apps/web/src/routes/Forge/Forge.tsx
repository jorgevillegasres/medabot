import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Steps } from '../../components/Steps';
import { useDraft } from '../../store/draft';
import { useRobot } from '../../store/robots';
import { ResultView } from '../Result';
import { StepBody } from './StepBody';
import { StepMedal } from './StepMedal';
import { StepTest } from './StepTest';

/** /forja/:step — los cuatro pasos. Protege el avance igual que nextStep() del MVP. */
export function Forge() {
  const step = Number(useParams().step);
  const draft = useDraft((s) => s.draft);
  const forgedId = useDraft((s) => s.forgedId);
  const reset = useDraft((s) => s.reset);
  const forged = useRobot(forgedId);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  if (![1, 2, 3, 4].includes(step)) return <Navigate to="/forja/1" replace />;
  if (step >= 2 && !draft.name.trim()) return <Navigate to="/forja/1" replace />;
  if (step === 3 && !draft.limit.trim()) return <Navigate to="/forja/2" replace />;
  if (step === 4 && !forged) return <Navigate to="/forja/3" replace />;

  return (
    <section className="view">
      <Steps current={step} />
      {step === 1 && <StepBody />}
      {step === 2 && <StepMedal />}
      {step === 3 && <StepTest />}
      {step === 4 && forged && (
        <ResultView
          robot={forged}
          onForgeAnother={() => {
            reset();
            navigate('/forja/1');
          }}
        />
      )}
    </section>
  );
}
