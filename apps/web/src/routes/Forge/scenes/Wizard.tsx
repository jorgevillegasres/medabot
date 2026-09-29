// Piezas compartidas por el Yunque y la Ciudad como asistente (spec 2026-09-29).
import { useEffect, useRef, type ReactNode } from 'react';

/** Barra «Etapa n de N · nombre», con un segmento por etapa. */
export function StageBar({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="stage-bar">
      <p className="stage-label">
        Etapa {current + 1} de {labels.length} · <b>{labels[current]}</b>
      </p>
      <ol aria-hidden="true">
        {labels.map((l, i) => (
          <li key={l} className={i < current ? 'done' : i === current ? 'now' : ''} />
        ))}
      </ol>
    </div>
  );
}

/** Tarjeta de reflexión: no se responde ni se guarda; es para pensar (guía docente §3–§4). */
export function Referee({ children }: { children: ReactNode }) {
  return (
    <aside className="referee-card">
      <span className="stamp">Sr. Referí</span>
      <p>{children}</p>
    </aside>
  );
}

/** Pantalla de un paso: el título recibe el foco al cambiar de paso (lectores de pantalla y teclado). */
export function StepScreen({
  stepKey,
  title,
  children,
}: {
  stepKey: string;
  title: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    // En la carga inicial no se roba el foco; solo al avanzar o retroceder.
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.focus();
  }, [stepKey]);
  return (
    <div className="step-screen" key={stepKey}>
      <h3 ref={ref} tabIndex={-1} className="step-title">
        {title}
      </h3>
      {children}
    </div>
  );
}

/** Atrás / Siguiente, fijos abajo en el celular. */
export function WizardNav({
  onBack,
  backLabel = 'Atrás',
  onNext,
  nextLabel = 'Siguiente',
  canNext = true,
  extra,
}: {
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  canNext?: boolean;
  extra?: ReactNode;
}) {
  return (
    <nav className="wizard-nav" aria-label="Pasos">
      {onBack && (
        <button type="button" className="btn alt" onClick={onBack}>
          {backLabel}
        </button>
      )}
      {extra}
      {onNext && (
        <button type="button" className="btn" disabled={!canNext} onClick={onNext}>
          {nextLabel}
        </button>
      )}
    </nav>
  );
}
