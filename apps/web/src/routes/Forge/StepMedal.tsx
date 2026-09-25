import { useNavigate } from 'react-router-dom';
import { CATALOGS } from '@medalab/content';
import { Chips, asItems } from '../../components/Chips';
import { RankList } from '../../components/RankList';
import { useDraft } from '../../store/draft';
import { toast } from '../../store/toast';

export function StepMedal() {
  const { draft, set, moveRank, toggleData } = useDraft();
  const navigate = useNavigate();

  const next = () => {
    if (!draft.limit.trim()) return toast('Escribe el límite infranqueable de tu robot.');
    navigate('/forja/3');
  };

  return (
    <div className="sheet">
      <span className="stamp">Forja de medalla</span>
      <div className="grid g2">
        <div>
          <h3>Jerarquía de principios</h3>
          <p className="hint">
            Todos son buenos. El problema es que chocan. Ordénalos: lo que está arriba gana cuando
            hay conflicto. Usa las flechas o arrastra desde el asa ⠿.
          </p>
          <RankList rank={draft.rank} onMove={moveRank} />
        </div>
        <div>
          <h3>
            <label htmlFor="fLimit" style={{ margin: 0 }}>
              Límite infranqueable
            </label>
          </h3>
          <p className="hint">
            Lo único que tu robot no hará nunca, ni siquiera si su medafighter se lo ordena.
          </p>
          <textarea
            id="fLimit"
            placeholder="Ej. Nunca borrará un registro que documente daño a una persona."
            value={draft.limit}
            onChange={(e) => set({ limit: e.target.value })}
          />
          <h3 style={{ marginTop: 16 }}>Rasgo de carácter</h3>
          <Chips
            label="Rasgo de carácter"
            items={asItems(CATALOGS.traits)}
            isOn={(v) => v === draft.trait}
            onPick={(v) => set({ trait: v })}
          />
          <h3 style={{ marginTop: 16 }}>Datos que recoge</h3>
          <Chips
            label="Datos que recoge"
            items={asItems(CATALOGS.data)}
            isOn={(v) => draft.data.includes(v)}
            onPick={toggleData}
          />
          <label htmlFor="fRetention">¿Cuánto tiempo los conserva y para qué?</label>
          <input
            type="text"
            id="fRetention"
            placeholder="Ej. 30 días, solo para reportar incidentes"
            value={draft.retention}
            onChange={(e) => set({ retention: e.target.value })}
          />
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
