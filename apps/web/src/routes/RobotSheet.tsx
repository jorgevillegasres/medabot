import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CIRCUITS, SCHOOLS, getType } from '@medalab/content';
import { MedalSvg } from '@medalab/ui';
import {
  currentUserId,
  getCourse,
  getRobot,
  updateRobot,
  type Course,
  type PublishedRobot,
} from '../lib/api';
import { Metric } from '../components/Metric';
import { EDITABLE } from '../lib/robotRow';
import { explain } from '../lib/supabase';
import { toast } from '../store/toast';

const LABELS: Record<(typeof EDITABLE)[number], string> = {
  name: 'Nombre del robot',
  purpose: 'Propósito concreto',
  limit: 'Límite infranqueable',
  retention: 'Retención de datos',
};

/** /robot/:robotId — ficha pública (versión estudiante: sin escuela técnica ni Kohlberg). */
export function RobotSheet() {
  const id = useParams().robotId!;
  const [item, setItem] = useState<PublishedRobot | null | undefined>(undefined);
  const [course, setCourse] = useState<Course | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getRobot(id)
      .then(async (p) => {
        setItem(p);
        if (p) setCourse(await getCourse(p.row.course_id));
      })
      .catch((e) => setError(explain(e)));
    currentUserId().then(setMe);
  }, [id]);

  if (error)
    return (
      <section className="view">
        <div className="empty" role="alert">
          {error}
        </div>
      </section>
    );
  if (item === undefined)
    return (
      <section className="view">
        <div className="empty">Cargando…</div>
      </section>
    );
  if (item === null)
    return (
      <section className="view">
        <div className="empty">
          Ese robot no existe o no es de tu curso. <Link to="/galeria">Volver a la galería</Link>
        </div>
      </section>
    );

  const { row, robot: r } = item;
  const mine = row.owner_id === me;
  const canEdit = mine && course && !course.gallery_closed;
  const s = SCHOOLS[r.school];

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patch = Object.fromEntries(EDITABLE.map((k) => [k, String(fd.get(k) ?? '').trim()]));
    if (!patch.name || !patch.limit) return toast('El nombre y el límite no pueden quedar vacíos.');
    try {
      setItem(await updateRobot(row.id, patch));
      setEditing(false);
      toast('Cambios guardados.');
    } catch (err) {
      toast(explain(err));
    }
  };

  return (
    <section className="view">
      <div className="sheet">
        <span className="stamp">Ficha del robot</span>
        <div className="medalwrap">
          <div className="medal">
            <MedalSvg robot={r} />
          </div>
          <div>
            <h2>{r.name}</h2>
            <p className="hint">
              {r.serial} · {getType(r.type)?.n} · sirve primero a: {r.principal} · diseñado por{' '}
              {r.author || 'anónimo'}
              {mine && <span className="tag mine">Tu robot</span>}
            </p>
            {editing ? (
              <form onSubmit={save}>
                {EDITABLE.map((k) => (
                  <div key={k}>
                    <label htmlFor={`e-${k}`}>{LABELS[k]}</label>
                    {k === 'purpose' || k === 'limit' ? (
                      <textarea id={`e-${k}`} name={k} defaultValue={r[k]} />
                    ) : (
                      <input
                        type="text"
                        id={`e-${k}`}
                        name={k}
                        defaultValue={r[k]}
                        maxLength={k === 'name' ? 30 : 500}
                      />
                    )}
                  </div>
                ))}
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn small" type="submit">
                    Guardar
                  </button>
                  <button className="btn small alt" type="button" onClick={() => setEditing(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p>{r.purpose || 'Sin propósito declarado.'}</p>
                <Metric label="Rasgo" value={r.trait} />
                <Metric label="Datos que recoge" value={r.data.join(', ') || '—'} />
                <Metric label="Retención" value={r.retention || '—'} />
                <Metric label="Límite infranqueable" value={r.limit} />
                <Metric label="Jerarquía declarada" value={r.rank.join(' › ')} />
                <Metric label="Temperamento" value={s?.t} />
                <Metric
                  label="Coherencia · compatibilidad"
                  value={`${r.coherence}% · ${r.compat}%`}
                />
                <Metric
                  label="Evolución · circuito"
                  value={`${r.evo || '—'} · ${CIRCUITS[r.circuit]?.n ?? '—'}`}
                />
                <div className="row" style={{ marginTop: 14 }}>
                  <Link className="btn small alt" to="/galeria">
                    Volver a la galería
                  </Link>
                  {canEdit && (
                    <button className="btn small" type="button" onClick={() => setEditing(true)}>
                      Editar mi robot
                    </button>
                  )}
                  {mine && course?.gallery_closed && (
                    <span className="hint">La galería está cerrada: ya no se puede editar.</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
