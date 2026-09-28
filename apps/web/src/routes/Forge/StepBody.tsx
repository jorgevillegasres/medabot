import { useNavigate } from 'react-router-dom';
import { RobotSvg } from '@medalab/ui';
import { useDraft } from '../../store/draft';
import { toast } from '../../store/toast';
import { BodyFields, ColorPicker, PartsPicker } from './fields';

export function StepBody() {
  const draft = useDraft((s) => s.draft);
  const navigate = useNavigate();

  const next = () => {
    if (!draft.name.trim()) return toast('Ponle nombre a tu robot antes de seguir.');
    navigate('/forja/2');
  };

  return (
    <div className="sheet">
      <span className="stamp">Medabot Data File</span>
      <div className="grid g2">
        <div>
          <BodyFields />
        </div>
        <div>
          <div className="preview">
            <RobotSvg robot={draft} />
          </div>
          <div style={{ marginTop: 12 }}>
            <PartsPicker />
          </div>
          <ColorPicker />
        </div>
      </div>
      <div className="row" style={{ marginTop: 18 }}>
        <button type="button" className="btn" onClick={next}>
          Continuar a la medalla
        </button>
      </div>
    </div>
  );
}
