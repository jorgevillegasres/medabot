import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SCHOOLS, getType } from '@medalab/content';
import { importRobots } from '@medalab/engine';
import { RobotSvg, downloadBlob } from '@medalab/ui';
import { useRobots } from '../store/robots';
import { toast } from '../store/toast';

/** /medallas — robots de este dispositivo; importar y exportar códigos (respaldo offline). */
export function Medals() {
  const { robots, addMany } = useRobots();
  const [text, setText] = useState('');

  const doImport = () => {
    const added = importRobots(text, { existingIds: robots.map((r) => r.id) });
    addMany(added);
    setText('');
    toast(
      added.length
        ? `${added.length} robot(s) importado(s).`
        : 'No se reconoció ningún código válido.',
    );
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(robots, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'medalab-galeria.json');
    toast('Galería exportada.');
  };

  return (
    <section className="view">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h2>Mis medallas</h2>
          <p className="hint">
            Los robots que viven en este dispositivo. Toca uno para abrir su medalla.
          </p>
        </div>
        <div className="row">
          {robots.length > 0 && (
            <Link className="btn small alt" to="/medallas/hoja">
              Hoja para imprimir
            </Link>
          )}
          <button
            type="button"
            className="btn small alt"
            onClick={exportAll}
            disabled={!robots.length}
          >
            Exportar todo (JSON)
          </button>
        </div>
      </div>

      {robots.length ? (
        <div className="cards">
          {robots.map((r) => (
            <Link className="card" key={r.id} to={`/medalla/${r.id}`}>
              <RobotSvg robot={r} className="robot-stage" />
              <h3>{r.name}</h3>
              <div className="serial">
                {r.serial} · {getType(r.type)?.n ?? ''}
              </div>
              <span className="tag">{SCHOOLS[r.school]?.t ?? ''}</span>
              <span className="tag">coherencia {r.coherence}%</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          Todavía no hay robots aquí. <Link to="/forja/1">Forja uno</Link>, o importa un código de
          medalla.
        </div>
      )}

      <div className="sheet" style={{ marginTop: 28 }}>
        <span className="stamp">Importar</span>
        <label htmlFor="impBox">Códigos de medalla</label>
        <p className="hint">
          Pega uno o varios códigos, uno por línea. También puedes pegar un archivo JSON exportado.
        </p>
        <textarea
          id="impBox"
          style={{ minHeight: 140 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="btn small" onClick={doImport} disabled={!text.trim()}>
            Importar
          </button>
        </div>
      </div>
    </section>
  );
}
