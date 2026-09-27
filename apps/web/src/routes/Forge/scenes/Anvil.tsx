import { useNavigate } from 'react-router-dom';
import { useDraft } from '../../../store/draft';
import { toast } from '../../../store/toast';
import { ComponentFields, LimitField, RankFields } from '../fields';
import { AnvilMedal } from './art/AnvilMedal';

/** Acto 2 · El Yunque: jerarquía, límite grabado y componentes. */
export function Anvil() {
  const draft = useDraft((s) => s.draft);
  const navigate = useNavigate();

  const next = () => {
    if (!draft.limit.trim()) return toast('Escribe el límite infranqueable de tu robot.');
    navigate('/forja/3');
  };

  return (
    <div className="scene anvil">
      <span className="act-stamp">Acto 2 · El Yunque</span>
      <div className="grid g2">
        <div>
          <AnvilMedal color={draft.color} limit={draft.limit} />
          <LimitField />
        </div>
        <div>
          <RankFields />
          <div className="sheet tray">
            <span className="stamp">Componentes</span>
            <ComponentFields />
          </div>
        </div>
      </div>
      <div className="row scene-actions">
        <button type="button" className="btn alt" onClick={() => navigate('/forja/1')}>
          Volver al taller
        </button>
        <button type="button" className="btn" onClick={next}>
          Salir a la ciudad
        </button>
      </div>
    </div>
  );
}
