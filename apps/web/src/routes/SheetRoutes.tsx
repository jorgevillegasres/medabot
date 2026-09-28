import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { MedalSheet } from '../components/MedalSheet';
import { getCourse, useCourseRobots, type Course } from '../lib/api';
import { useAuth } from '../lib/auth';
import { isOnline } from '../lib/supabase';
import { useRobots } from '../store/robots';

/** /profesor/hoja?curso=ID — medallas del curso, solo con sesión de profesor. */
export function CourseSheet() {
  const { teacher, loading } = useAuth();
  const courseId = useSearchParams()[0].get('curso');
  const [course, setCourse] = useState<Course | null>(null);
  const { robots, loading: loadingRobots } = useCourseRobots(teacher ? courseId : null);

  useEffect(() => {
    if (teacher && courseId) getCourse(courseId).then(setCourse);
  }, [teacher, courseId]);

  if (!isOnline || (!loading && !teacher)) return <Navigate to="/profesor" replace />;
  if (!courseId) return <Navigate to="/profesor/panel" replace />;
  if (loading || loadingRobots) return <div className="empty">Cargando…</div>;

  return (
    <section className="view">
      <p className="noprint">
        <Link to="/profesor/panel">← Volver al panel</Link>
      </p>
      <MedalSheet title={course?.name ?? 'Curso'} robots={robots.map((p) => p.robot)} />
    </section>
  );
}

/** /medallas/hoja — las medallas guardadas en este dispositivo (sirve sin servidor). */
export function LocalSheet() {
  const robots = useRobots((s) => s.robots);
  return (
    <section className="view">
      <p className="noprint">
        <Link to="/medallas">← Volver a mis medallas</Link>
      </p>
      <MedalSheet title="Este dispositivo" robots={robots} />
    </section>
  );
}
