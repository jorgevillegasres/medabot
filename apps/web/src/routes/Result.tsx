import { Link, useParams } from 'react-router-dom';
import { CIRCUITS, SCHOOLS, getType } from '@medalab/content';
import { axesByWeight, medalCode, type Robot } from '@medalab/engine';
import { MedalSvg, downloadBlob, exportPng, medalSvg } from '@medalab/ui';
import { toast } from '../store/toast';
import { useRobot } from '../store/robots';

/** Ancho del PNG de la medalla. La versión de impresión (2400 px) llega en la Fase 4. */
const PNG_WIDTH = 1200;

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

  const savePng = async () => {
    const { blob, ext } = await exportPng(medalSvg(r), PNG_WIDTH);
    downloadBlob(blob, `medalla-${r.serial}.${ext}`);
    toast(ext === 'png' ? 'Medalla guardada.' : 'Medalla guardada como SVG.');
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
          <div className="row" style={{ marginTop: 12 }}>
            <button type="button" className="btn small" onClick={copyCode}>
              Copiar código
            </button>
            <button type="button" className="btn small alt" onClick={savePng}>
              Descargar medalla PNG
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

function Metric({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b>{value ?? '—'}</b>
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
