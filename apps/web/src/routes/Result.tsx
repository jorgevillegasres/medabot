import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CIRCUITS, SCHOOLS, getType } from '@medalab/content';
import { axesByWeight, medalCode, type Robot } from '@medalab/engine';
import {
  MedalSvg,
  PRINT_WIDTH,
  downloadBlob,
  exportPng,
  medalSvg,
  printableMedalSvg,
} from '@medalab/ui';
import { Metric } from '../components/Metric';
import { publishRobot } from '../lib/api';
import { archivoDataUrl } from '../lib/printFont';
import { explain, isOnline } from '../lib/supabase';
import { useCourse } from '../store/course';
import { toast } from '../store/toast';
import { useRobot, useRobots } from '../store/robots';

interface Props {
  robot: Robot;
  /** Solo dentro de la forja: botón "Forjar otra". */
  onForgeAnother?: () => void;
}

/**
 * Resultado de la medalla. No muestra el nombre técnico de la escuela ni la etapa
 * de Kohlberg: eso es solo para el profesor.
 */
export function ResultView({ robot: r, onForgeAnother }: Props) {
  const school = SCHOOLS[r.school];
  const top = axesByWeight(r.profile);
  const code = medalCode(r);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast('Código copiado.');
    } catch {
      toast('Selecciona el código y cópialo manualmente.');
    }
  };

  /** SVG de impresión (fuente incrustada); sin conexión para la fuente, el de pantalla. */
  const printSvg = async () => {
    try {
      return printableMedalSvg(r, await archivoDataUrl());
    } catch {
      return medalSvg(r);
    }
  };

  // PNG de 2400×2550 px: se imprime igual que se ve en pantalla.
  const savePng = async () => {
    const { blob, ext } = await exportPng(await printSvg(), PRINT_WIDTH);
    downloadBlob(blob, `medalla-${r.serial}.${ext}`);
    toast(ext === 'png' ? 'Medalla guardada.' : 'Medalla guardada como SVG.');
  };

  const saveSvg = async () => {
    downloadBlob(
      new Blob([await printSvg()], { type: 'image/svg+xml' }),
      `medalla-${r.serial}.svg`,
    );
    toast('Medalla guardada en SVG para imprenta.');
  };

  return (
    <div className="sheet">
      <span className="stamp">Medalla grabada</span>
      <div className="medalwrap">
        <div className="medal">
          <MedalSvg robot={r} />
        </div>
        <div>
          <h2>{r.name}</h2>
          <p className="hint">
            {r.serial} · {getType(r.type)?.n} · diseñado por {r.author || 'anónimo'}
          </p>
          <p className="hint">{r.evoDesc}</p>
          <Metric label="Temperamento de la medalla" value={school?.t} />
          <Metric label="Principio que más pesó" value={top[0].n} />
          <Metric label="Principio que menos pesó" value={top[5].n} />
          <Metric label="Coherencia declarado / observado" value={`${r.coherence}%`} />
          <Metric label="Compatibilidad medalla / tipo" value={`${r.compat}%`} />
          <Metric label="Evolución de la medalla" value={r.evo} />
          <Metric label="Circuito recorrido" value={CIRCUITS[r.circuit]?.n} />
          <div className="lore" style={{ marginTop: 14 }}>
            {r.contra.length ? (
              <p>
                <b>Contradicción detectada.</b> Declaraste que {r.contra.join(' y ')} iba arriba,
                pero cuando el robot decidió, casi no contó. Eso no es un error: es el tema de la
                clase.
              </p>
            ) : (
              <p>
                Tu robot decidió como dijiste que decidiría. Ahora la pregunta es si eso es una
                virtud o una rigidez. Lo veremos en la Arena.
              </p>
            )}
          </div>
          <h3 style={{ marginTop: 16 }}>Código de medalla</h3>
          <p className="hint">
            Cópialo y envíaselo al profesor. Con él, tu robot entra a la galería del curso.
          </p>
          <div className="code" data-testid="medal-code" tabIndex={0}>
            {code}
          </div>
          <PublishBox robot={r} />
          <div className="row" style={{ marginTop: 12 }}>
            <button type="button" className="btn small alt" onClick={copyCode}>
              Copiar código
            </button>
            <button type="button" className="btn small alt" onClick={savePng}>
              Descargar medalla PNG
            </button>
            <button type="button" className="btn small alt" onClick={saveSvg}>
              SVG para imprenta
            </button>
            {onForgeAnother && (
              <button type="button" className="btn small alt" onClick={onForgeAnother}>
                Forjar otra
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Publicar en la galería del curso (solo si hay servidor y el estudiante entró a un curso). */
function PublishBox({ robot }: { robot: Robot }) {
  const course = useCourse((s) => s.course);
  const publishedId = useCourse((s) => s.published[robot.id]);
  const markPublished = useCourse((s) => s.markPublished);
  const updateLocal = useRobots((s) => s.update);
  const [busy, setBusy] = useState(false);

  if (!isOnline) return null;
  if (!course)
    return (
      <p className="hint" style={{ marginTop: 12 }}>
        Para publicar tu robot en la galería del curso,{' '}
        <Link to="/entrar">entra con el código de tu curso</Link>.
      </p>
    );
  if (publishedId)
    return (
      <p className="hint" style={{ marginTop: 12 }}>
        Publicado en la galería de {course.name}.{' '}
        <Link to={`/robot/${publishedId}`}>Ver su ficha</Link>
      </p>
    );

  const publish = async () => {
    setBusy(true);
    try {
      const { row } = await publishRobot(robot, course.id);
      // Si la serie chocó con otra del curso, el servidor tiene la nueva: se sincroniza.
      if (row.serial !== robot.serial) updateLocal(robot.id, { serial: row.serial });
      markPublished(robot.id, row.id);
      toast('Robot publicado en la galería.');
    } catch (err) {
      toast(explain(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="row" style={{ marginTop: 12 }}>
      <button type="button" className="btn" onClick={publish} disabled={busy}>
        {busy ? 'Publicando…' : 'Publicar en la galería'}
      </button>
      <span className="hint">Curso: {course.name}</span>
    </div>
  );
}

/** /medalla/:robotId — cualquier robot guardado en este dispositivo. */
export function MedalRoute() {
  const robot = useRobot(useParams().robotId);
  if (!robot)
    return (
      <section className="view">
        <div className="empty">
          No encontramos esa medalla en este dispositivo.{' '}
          <Link to="/medallas">Ver mis medallas</Link>
        </div>
      </section>
    );
  return (
    <section className="view">
      <ResultView robot={robot} />
    </section>
  );
}
