import { useRef, useState } from 'react';
import { AXES, type AxisKey } from '@medalab/content';

interface Props {
  rank: AxisKey[];
  onMove: (from: number, to: number) => void;
}

/**
 * Jerarquía de principios: botones subir/bajar (como el MVP) y arrastre con el asa,
 * que funciona con mouse y con el dedo (pointer events).
 */
export function RankList({ rank, onMove }: Props) {
  const listRef = useRef<HTMLOListElement>(null);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);

  const targetIndex = (from: number, clientY: number) => {
    const items = Array.from(listRef.current?.children ?? []) as HTMLElement[];
    // Nueva posición = cuántos de los otros elementos quedan por encima del puntero.
    return items.filter((el, i) => {
      if (i === from) return false;
      const r = el.getBoundingClientRect();
      return clientY > r.top + r.height / 2;
    }).length;
  };

  return (
    <ol className="rank" ref={listRef}>
      {rank.map((k, i) => {
        const a = AXES.find((x) => x.k === k)!;
        const cls = drag?.from === i ? 'dragging' : drag && drag.to === i ? 'drop' : '';
        return (
          <li key={k} className={cls} data-axis={k}>
            <span
              className="handle"
              aria-hidden="true"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setDrag({ from: i, to: i });
              }}
              onPointerMove={(e) => {
                if (drag) setDrag({ from: drag.from, to: targetIndex(drag.from, e.clientY) });
              }}
              onPointerUp={() => {
                if (drag && drag.to !== drag.from) onMove(drag.from, drag.to);
                setDrag(null);
              }}
              onPointerCancel={() => setDrag(null)}
            >
              ⠿
            </span>
            <span className="v">
              {a.n}
              <small>{a.d}</small>
            </span>
            <button
              type="button"
              aria-label={`Subir ${a.n}`}
              disabled={i === 0}
              onClick={() => onMove(i, i - 1)}
            >
              ▲
            </button>
            <button
              type="button"
              aria-label={`Bajar ${a.n}`}
              disabled={i === rank.length - 1}
              onClick={() => onMove(i, i + 1)}
            >
              ▼
            </button>
          </li>
        );
      })}
    </ol>
  );
}
