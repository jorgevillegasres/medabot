const LABELS = ['1 · Cuerpo', '2 · Medalla', '3 · Test', '4 · Resultado'];

export function Steps({ current, labels = LABELS }: { current: number; labels?: string[] }) {
  return (
    <ol className="steps" aria-label="Pasos de la forja">
      {labels.map((l, i) => {
        const n = i + 1;
        const cls = n < current ? 'done' : n === current ? 'on' : '';
        return (
          <li key={l} className={cls} aria-current={n === current ? 'step' : undefined}>
            {l}
          </li>
        );
      })}
    </ol>
  );
}
