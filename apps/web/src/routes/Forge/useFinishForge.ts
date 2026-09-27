import { useNavigate } from 'react-router-dom';
import { forgeRobot, makeSerial } from '@medalab/engine';
import { useDraft } from '../../store/draft';
import { useRobots } from '../../store/robots';

/** Graba la medalla con el borrador actual y va al acto 4 (igual que finish() del MVP). */
export function useFinishForge() {
  const draft = useDraft((s) => s.draft);
  const setForged = useDraft((s) => s.setForged);
  const addRobot = useRobots((s) => s.add);
  const navigate = useNavigate();
  return () => {
    const robot = forgeRobot(draft, {
      id: crypto.randomUUID(),
      serial: makeSerial(draft.type),
      created: new Date().toISOString(),
    });
    addRobot(robot);
    setForged(robot.id);
    navigate('/forja/4');
  };
}
