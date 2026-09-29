// Campos de la forja, compartidos por la forja clásica (Step*) y las escenas del juego.
import { AXES, CATALOGS, TYPES, getType, type PartKey } from '@medalab/content';
import { PartSvg } from '@medalab/ui';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Chips, asItems } from '../../components/Chips';
import { RankList } from '../../components/RankList';
import { useDraft } from '../../store/draft';

/** Nombre, autor, tipo, propósito y a quién sirve. */
export function BodyFields() {
  const { draft, set } = useDraft();
  const type = getType(draft.type);
  return (
    <>
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
    </>
  );
}

const PART_TABS: { label: string; parts: PartKey[] }[] = [
  { label: 'Cabeza', parts: ['head'] },
  { label: 'Brazos', parts: ['rarm', 'larm'] },
  { label: 'Piernas', parts: ['legs'] },
];

/** Las cuatro medapartes, agrupadas en pestañas. onPick se llama tras instalar una pieza. */
export function PartsPicker({ onPick }: { onPick?: () => void }) {
  const { draft, setPart } = useDraft();
  const [tab, setTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (tab + d + PART_TABS.length) % PART_TABS.length;
    setTab(n);
    tabRefs.current[n]?.focus();
  };
  return (
    <div className="parts">
      <div className="part-tabs" role="tablist" aria-label="Medapartes" onKeyDown={onKey}>
        {PART_TABS.map((t, i) => (
          <button
            key={t.label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-t${i}`}
            aria-selected={tab === i}
            aria-controls={`${id}-p${i}`}
            tabIndex={tab === i ? 0 : -1}
            onClick={() => setTab(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {PART_TABS.map((t, i) => (
        <div
          key={t.label}
          role="tabpanel"
          id={`${id}-p${i}`}
          aria-labelledby={`${id}-t${i}`}
          hidden={tab !== i}
        >
          {t.parts.map((k) => (
            <div className="partpick" key={k} role="group" aria-label={CATALOGS.parts[k].n}>
              {t.parts.length > 1 && <b>{CATALOGS.parts[k].n}</b>}
              <div className="opts">
                {CATALOGS.parts[k].opts.map((o, j) => (
                  <button
                    type="button"
                    key={o}
                    className={draft.parts[k] === j ? 'on' : ''}
                    aria-pressed={draft.parts[k] === j}
                    onClick={() => {
                      setPart(k, j);
                      onPick?.();
                    }}
                  >
                    <PartSvg part={k} option={j} color={draft.color} />
                    <span>{o}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ColorPicker({
  label = 'Color del tin-pet',
  onPick,
}: {
  label?: string;
  onPick?: () => void;
}) {
  const { draft, set } = useDraft();
  return (
    <>
      <div className="label">{label}</div>
      <div className="swatches" role="group" aria-label={label}>
        {CATALOGS.colors.map((c) => (
          <button
            type="button"
            key={c}
            style={{ background: c }}
            className={draft.color === c ? 'on' : ''}
            aria-pressed={draft.color === c}
            aria-label={`color ${c}`}
            onClick={() => {
              set({ color: c });
              onPick?.();
            }}
          />
        ))}
      </div>
    </>
  );
}

/** Jerarquía de principios. */
export function RankFields() {
  const { draft, moveRank } = useDraft();
  return (
    <>
      <h3>Jerarquía de principios</h3>
      <p className="hint">
        Todos son buenos. El problema es que chocan. Ordénalos: lo que está arriba gana cuando hay
        conflicto. Usa las flechas o arrastra desde el asa ⠿.
      </p>
      <RankList rank={draft.rank} onMove={moveRank} />
    </>
  );
}

/** Límite infranqueable (obligatorio). */
export function LimitField() {
  const { draft, set } = useDraft();
  return (
    <>
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
    </>
  );
}

/** Rasgo, datos que recoge y retención. */
export function ComponentFields() {
  const { draft, set, toggleData } = useDraft();
  return (
    <>
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
    </>
  );
}
