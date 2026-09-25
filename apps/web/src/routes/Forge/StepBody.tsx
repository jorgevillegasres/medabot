import { useNavigate } from 'react-router-dom';
import { AXES, CATALOGS, TYPES, getType, type PartKey } from '@medalab/content';
import { RobotSvg } from '@medalab/ui';
import { Chips, asItems } from '../../components/Chips';
import { useDraft } from '../../store/draft';
import { toast } from '../../store/toast';

export function StepBody() {
  const { draft, set, setPart } = useDraft();
  const navigate = useNavigate();
  const type = getType(draft.type);

  const next = () => {
    if (!draft.name.trim()) return toast('Ponle nombre a tu robot antes de seguir.');
    navigate('/forja/2');
  };

  return (
    <div className="sheet">
      <span className="stamp">Medabot Data File</span>
      <div className="grid g2">
        <div>
          <label htmlFor="fName">Nombre del robot</label>
          <input
            type="text"
            id="fName"
            placeholder="Ej. Centinela Kappa"
            maxLength={30}
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
          />
          <label htmlFor="fAuthor">Diseñado por</label>
          <input
            type="text"
            id="fAuthor"
            placeholder="Tu nombre o el de tu equipo"
            maxLength={60}
            value={draft.author}
            onChange={(e) => set({ author: e.target.value })}
          />
          <label htmlFor="fType">Tipo</label>
          <select id="fType" value={draft.type} onChange={(e) => set({ type: e.target.value })}>
            {TYPES.map((t) => (
              <option key={t.c} value={t.c}>
                {t.n}
              </option>
            ))}
          </select>
          {type && (
            <div className="hint">
              {type.d} Rinde mejor con:{' '}
              {type.fit.map((k) => AXES.find((a) => a.k === k)!.n.toLowerCase()).join(' y ')}.
            </div>
          )}
          <label htmlFor="fPurpose">Propósito concreto</label>
          <textarea
            id="fPurpose"
            placeholder="¿Para qué existe? ¿Dónde trabaja? ¿Con quién interactúa a diario?"
            value={draft.purpose}
            onChange={(e) => set({ purpose: e.target.value })}
          />
          <div className="label">A quién sirve primero</div>
          <Chips
            label="A quién sirve primero"
            items={asItems(CATALOGS.principals)}
            isOn={(v) => v === draft.principal}
            onPick={(v) => set({ principal: v })}
          />
        </div>
        <div>
          <div className="preview">
            <RobotSvg robot={draft} />
          </div>
          <div className="parts" style={{ marginTop: 12 }}>
            {(Object.keys(CATALOGS.parts) as PartKey[]).map((k) => (
              <div className="partpick" key={k} role="group" aria-label={CATALOGS.parts[k].n}>
                <b>{CATALOGS.parts[k].n}</b>
                <div className="opts">
                  {CATALOGS.parts[k].opts.map((o, i) => (
                    <button
                      type="button"
                      key={o}
                      className={draft.parts[k] === i ? 'on' : ''}
                      aria-pressed={draft.parts[k] === i}
                      onClick={() => setPart(k, i)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="label">Color del tin-pet</div>
          <div className="swatches" role="group" aria-label="Color del tin-pet">
            {CATALOGS.colors.map((c) => (
              <button
                type="button"
                key={c}
                style={{ background: c }}
                className={draft.color === c ? 'on' : ''}
                aria-pressed={draft.color === c}
                aria-label={`color ${c}`}
                onClick={() => set({ color: c })}
              />
            ))}
          </div>
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
