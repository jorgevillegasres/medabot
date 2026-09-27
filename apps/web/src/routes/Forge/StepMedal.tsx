import { useNavigate } from 'react-router-dom';
import { useDraft } from '../../store/draft';
import { toast } from '../../store/toast';
import { ComponentFields, LimitField, RankFields } from './fields';

export function StepMedal() {
  const limit = useDraft((s) => s.draft.limit);
  const navigate = useNavigate();

  const next = () => {
    if (!limit.trim()) return toast('Escribe el límite infranqueable de tu robot.');
    navigate('/forja/3');
  };

  return (
    <div className="sheet">
      <span className="stamp">Forja de medalla</span>
      <div className="grid g2">
        <div>
          <RankFields />
        </div>
        <div>
          <LimitField />
          <ComponentFields />
        </div>
      </div>
      <div className="row" style={{ marginTop: 18 }}>
        <button type="button" className="btn alt" onClick={() => navigate('/forja/1')}>
          Volver
        </button>
        <button type="button" className="btn" onClick={next}>
          Ir al test moral
        </button>
      </div>
    </div>
  );
}
