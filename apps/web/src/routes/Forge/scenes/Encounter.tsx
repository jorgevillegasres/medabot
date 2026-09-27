import { useEffect, useRef } from 'react';
import { AXES, CIRCUITS, REASONS, type AxisKey, type Dilemma } from '@medalab/content';
import { Chips } from '../../../components/Chips';
import { placeOf } from '../../../game/city';
import { dominantAxis } from '../../../game/reaction';
import { useDraft } from '../../../store/draft';
import { Silhouette } from './art/Silhouette';

const REASON_ITEMS = REASONS.map((r) => ({ value: r.s, label: r.x }));

interface Props {
  dilemma: Dilemma;
  /** Posición en testFor(type), 0..9. */
  index: number;
  total: number;
  /** axis = eje dominante si el encuentro quedó resuelto; null si se cerró sin resolver. */
  onClose: (axis: AxisKey | null) => void;
}

/** Viñeta de cómic con un dilema. El texto se muestra idéntico al contenido. */
export function Encounter({ dilemma: d, index, total, onClose }: Props) {
  const answer = useDraft((s) => s.answer);
  const reason = useDraft((s) => s.reason);
  const chosen = useDraft((s) => s.draft.answers[d.id]);
  const why = useDraft((s) => s.draft.reasons[d.id]);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Con llaves: un efecto no debe devolver nada que no sea una función de limpieza.
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const solved = chosen != null && why != null;
  const axis = solved ? dominantAxis(d.o[chosen]) : null;

  return (
    <div className="dialog-backdrop">
      <div
        className="encounter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enc-title"
        data-dilemma={d.id}
        data-index={index}
      >
        <div className="cartel">
          <span>
            {index + 1}/{total} · Circuito {CIRCUITS[d.c].n}
          </span>
          <h2 id="enc-title" tabIndex={-1} ref={titleRef}>
            {d.t}
          </h2>
        </div>
        <button
          type="button"
          className="close"
          aria-label="Volver al mapa"
          onClick={() => onClose(null)}
        >
          ✕
        </button>
        <div className="panel-scene">
          <Silhouette color={placeOf(d.c).color} />
          <p className="bubble">{d.s}</p>
        </div>
        <p className="hint">¿Qué hace tu robot?</p>
        {d.o.map((o, j) => (
          <button
            type="button"
            key={j}
            className={chosen === j ? 'action-card on' : 'action-card'}
            aria-pressed={chosen === j}
            onClick={() => answer(d.id, j)}
          >
            {o.x}
          </button>
        ))}
        {chosen != null && (
          <div className="why">
            <b>¿Por qué lo hace?</b>
            <Chips
              small
              label="¿Por qué lo hace?"
              items={REASON_ITEMS}
              isOn={(s) => why === s}
              onPick={(s) => reason(d.id, s)}
            />
          </div>
        )}
        {axis && (
          <div className="reaction" role="status">
            <span className="spark-axis">✦ {AXES.find((a) => a.k === axis)!.n}</span>
            <span className="stamp-solved">Resuelto</span>
          </div>
        )}
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="btn" disabled={!solved} onClick={() => onClose(axis)}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
