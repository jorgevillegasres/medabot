import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { SCHOOLS, getType } from '@medalab/content';
import { MedalSvg, RobotSvg } from '@medalab/ui';
import { BoutView } from '../components/BoutView';
import { getCourse, useCourseRobots, type Course, type PublishedRobot } from '../lib/api';
import { useBoutRobots, useCurrentBout, useVoteCounts } from '../lib/arenaApi';
import { useAuth } from '../lib/auth';
import { isOnline } from '../lib/supabase';

/** /pantalla?curso=ID — proyección, sin controles. Sin datos ocultos del profesor. */
export function Screen() {
  const { teacher, loading } = useAuth();
  const courseId = useSearchParams()[0].get('curso');
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (teacher && courseId) getCourse(courseId).then(setCourse);
  }, [teacher, courseId]);

  if (!isOnline || (!loading && !teacher)) return <Navigate to="/profesor" replace />;
  if (!courseId) return <Navigate to="/arena" replace />;

  return (
    <section className="view screen">
      <ScreenBody courseId={courseId} course={course} />
    </section>
  );
}

function ScreenBody({ courseId, course }: { courseId: string; course: Course | null }) {
  const { bout } = useCurrentBout(courseId);
  const { counts } = useVoteCounts(bout?.id);
  const pair = useBoutRobots(bout);
  const { robots } = useCourseRobots(courseId);

  if (bout && bout.status !== 'closed' && pair)
    return <BoutView bout={bout} robots={pair} counts={counts} big />;
  return <Mosaic robots={robots} course={course} />;
}

/** Fuera de robatalla: la galería en mosaico, con un robot destacado que rota despacio. */
function Mosaic({ robots, course }: { robots: PublishedRobot[]; course: Course | null }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (robots.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % robots.length), 8000);
    return () => clearInterval(t);
  }, [robots.length]);

  if (!robots.length)
    return (
      <div className="empty">
        <h2>Galería del laboratorio</h2>
        {course && (
          <p>
            Entren con el código <b className="joincode">{course.join_code}</b>
          </p>
        )}
      </div>
    );

  const featured = robots[i % robots.length].robot;
  return (
    <div className="mosaic">
      <div className="featured sheet" key={featured.id}>
        <span className="stamp">{course?.join_code ?? 'Galería'}</span>
        <MedalSvg robot={featured} />
        <h2>{featured.name}</h2>
        <p className="hint">
          {featured.serial} · {getType(featured.type)?.n} · {SCHOOLS[featured.school]?.t}
        </p>
      </div>
      <div className="tiles">
        {robots.map(({ row, robot }, k) => (
          <div className={k === i % robots.length ? 'tile on' : 'tile'} key={row.id}>
            <RobotSvg robot={robot} />
            <span>{robot.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
