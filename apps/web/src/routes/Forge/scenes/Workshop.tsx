import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RobotSvg } from '@medalab/ui';
import { useDraft } from '../../../store/draft';
import { toast } from '../../../store/toast';
import { BodyFields, ColorPicker, PartsPicker } from '../fields';

/** Acto 1 · El Taller: armar el cuerpo y llenar la ficha. */
export function Workshop() {
  const draft = useDraft((s) => s.draft);
  const navigate = useNavigate();
  const [spark, setSpark] = useState(0);
  const install = () => setSpark((s) => s + 1);

  const next = () => {
    if (!draft.name.trim()) return toast('Ponle nombre a tu robot antes de seguir.');
    navigate('/forja/2');
  };

  return (
    <div className="scene workshop">
      <h2 className="act-stamp">Acto 1 · El Taller</h2>
      <div className="grid g2">
        <div className="bench">
          {/* key: cada pieza nueva vuelve a montar el robot y dispara la animación de encaje */}
          <div
            className={spark ? 'bench-robot robot-stage spark' : 'bench-robot robot-stage'}
            key={spark}
          >
            <RobotSvg robot={draft} />
          </div>
          <div className="shelf" role="group" aria-label="Estante de medapartes">
            <PartsPicker onPick={install} />
          </div>
          <ColorPicker label="Botes de pintura" onPick={install} />
        </div>
        <div className="sheet datafile">
          <span className="stamp">Medabot Data File</span>
          <BodyFields />
        </div>
      </div>
      <div className="row scene-actions">
        <button type="button" className="btn" onClick={next}>
          Ir al yunque
        </button>
      </div>
    </div>
  );
}
