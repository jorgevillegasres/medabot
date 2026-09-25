import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SCHOOLS, getType } from '@medalab/content';
import { RobotSvg } from '@medalab/ui';
import { currentUserId, useCourseRobots } from '../lib/api';
import { explain, isOnline } from '../lib/supabase';
import { useCourse } from '../store/course';

/** /galeria — robots del curso en tiempo real. */
export function Gallery() {
  const course = useCourse((s) => s.course);
  const { robots, loading, error } = useCourseRobots(course?.id);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    if (isOnline) currentUserId().then(setMe);
  }, []);

  if (!isOnline) return <Navigate to="/medallas" replace />;
  if (!course) return <Navigate to="/entrar" replace />;

  return (
    <section className="view">
      <div style={{ marginBottom: 18 }}>
        <h2>Galería del laboratorio</h2>
        <p className="hint">
          {course.name} · {robots.length} robot(s). Se actualiza sola. Toca uno para abrir su ficha.
        </p>
      </div>
      {error ? (
        <div className="empty" role="alert">
          {explain(error)}
        </div>
      ) : loading ? (
        <div className="empty">Cargando…</div>
      ) : robots.length ? (
        <div className="cards" data-testid="gallery">
          {robots.map(({ row, robot: r }) => (
            <Link className="card" key={row.id} to={`/robot/${row.id}`} data-serial={r.serial}>
              <RobotSvg robot={r} />
              <h3>{r.name}</h3>
              <div className="serial">
                {r.serial} · {getType(r.type)?.n ?? ''}
              </div>
              <span className="tag">{SCHOOLS[r.school]?.t ?? ''}</span>
              <span className="tag">coherencia {r.coherence}%</span>
              {row.owner_id === me && <span className="tag mine">Tu robot</span>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          Todavía no hay robots publicados. <Link to="/forja/1">Forja el primero</Link>.
        </div>
      )}
    </section>
  );
}
