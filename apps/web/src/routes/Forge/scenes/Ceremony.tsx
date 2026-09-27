import { useEffect, useState } from 'react';
import type { Robot } from '@medalab/engine';
import { MedalSvg, RobotSvg } from '@medalab/ui';
import { CORPORATION } from '../../../game/city';
import { useReducedMotion } from '../../../game/motion';
import { useGame } from '../../../store/game';
import { ResultView } from '../../Result';
import { AnvilMedal } from './art/AnvilMedal';

const STEP_MS = 1400;
/** 0 = se funde, 1 = radar, 2 = instalación, 3 = resultado. */
const FINAL = 3;

/** Acto 4 · La Ceremonia. Se ve una vez por robot; con movimiento reducido va directo al resultado. */
export function Ceremony({ robot, onForgeAnother }: { robot: Robot; onForgeAnother: () => void }) {
  const reduced = useReducedMotion();
  const seenKey = `ceremonia:${robot.id}`;
  const seen = useGame((s) => s.seenUnlocks.includes(seenKey));
  const markSeen = useGame((s) => s.markSeen);
  const [stage, setStage] = useState(reduced || seen ? FINAL : 0);

  useEffect(() => {
    if (stage >= FINAL) {
      markSeen(seenKey);
      return;
    }
    const t = setTimeout(() => setStage((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [stage, seenKey, markSeen]);

  // Saltar con una tecla (Enter, Espacio o Escape), además del toque y del botón.
  useEffect(() => {
    if (stage >= FINAL) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.target as HTMLElement | null)?.tagName === 'BUTTON') return; // tecla sostenida o un botón enfocado: que actúe el botón
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        setStage(FINAL);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage]);

  if (stage >= FINAL)
    return (
      <div className="ceremony-done">
        <ResultView robot={robot} onForgeAnother={onForgeAnother} />
      </div>
    );

  return (
    // Un toque en cualquier parte de la escena la salta (el botón «Saltar» es la vía accesible).
    <div className="scene ceremony sheet" onClick={() => setStage(FINAL)}>
      <h2 className="act-stamp">Acto 4 · La Ceremonia</h2>
      <div className="ceremony-stage" role="status" aria-live="polite">
        {stage === 0 && (
          <>
            <AnvilMedal color={robot.color} limit={robot.limit} />
            <p>
              La medalla de {robot.name} se funde en la {CORPORATION.name}…
            </p>
          </>
        )}
        {stage === 1 && (
          <>
            <MedalSvg robot={robot} className="ceremony-medal" />
            <p>Se graba el radar de sus seis principios…</p>
          </>
        )}
        {stage === 2 && (
          <>
            <div className="install">
              <RobotSvg robot={robot} />
              <MedalSvg robot={robot} className="install-medal" />
            </div>
            <p>La medalla se instala en la espalda de {robot.name}.</p>
          </>
        )}
      </div>
      <button type="button" className="btn small alt" onClick={() => setStage(FINAL)}>
        Saltar
      </button>
    </div>
  );
}
