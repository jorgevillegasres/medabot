const LABELS = ['1 · Cuerpo', '2 · Medalla', '3 · Test', '4 · Resultado'];
const bare = (l: string) => l.replace(/^\d+\s*·\s*/, '');

export function Steps({
  current,
  labels = LABELS,
  noun = 'Paso',
}: {
  current: number;
  labels?: string[];
  noun?: string;
}) {
  return (
    <div className="steps" role="group" aria-label="Pasos de la forja">
      <p className="steps-now">
        {noun} {current} de {labels.length} · {bare(labels[current - 1] ?? '')}
      </p>
      <ol>
        {labels.map((l, i) => {
          const n = i + 1;
          const cls = n < current ? 'done' : n === current ? 'on' : '';
          return (
            <li key={l} className={cls} aria-current={n === current ? 'step' : undefined}>
              <span>{bare(l)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
