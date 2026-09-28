// Hoja de medallas para imprimir (PLAN.md Fase 4): 6 por página A4 con nombre, serie y autor.
// El navegador la convierte en PDF con «Imprimir → Guardar como PDF».
import type { Robot } from '@medalab/engine';
import { MedalSvg } from '@medalab/ui';

export const PER_PAGE = 6;

export function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export function MedalSheet({ title, robots }: { title: string; robots: Robot[] }) {
  const pages = chunk(robots, PER_PAGE);
  return (
    <div className="medal-sheet">
      <div className="row noprint" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2>Hoja de medallas</h2>
          <p className="hint">
            {title} · {robots.length} medalla(s) · {pages.length} página(s) A4. Para PDF: «Imprimir»
            y elige «Guardar como PDF».
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => window.print()}
          disabled={!robots.length}
        >
          Imprimir / Guardar PDF
        </button>
      </div>
      {!robots.length && <div className="empty">No hay medallas para imprimir.</div>}
      {pages.map((page, i) => (
        <section className="sheet-page" key={i} aria-label={`Página ${i + 1}`}>
          {page.map((r) => (
            <figure className="medal-card" key={r.id}>
              <MedalSvg robot={r} />
              <figcaption>
                <b>{r.name}</b>
                <span className="serial">{r.serial}</span>
                <span>{r.author || 'anónimo'}</span>
              </figcaption>
            </figure>
          ))}
        </section>
      ))}
    </div>
  );
}
