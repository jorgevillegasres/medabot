import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ARENA, CIRCUITS, getScenario } from '@medalab/content';
import { BoutView } from '../components/BoutView';
import { listMyCourses, useCourseRobots, type Course } from '../lib/api';
import { nextStatus, resultFor, voters, votingPhase, type BoutStatus } from '../lib/arena';
import {
  advanceBout,
  presentBout,
  useBoutRobots,
  useCurrentBout,
  useVoteCounts,
} from '../lib/arenaApi';
import { useAuth } from '../lib/auth';
import { explain, isOnline } from '../lib/supabase';
import { toast } from '../store/toast';

const ACTION: Record<BoutStatus, string> = {
  open: 'Revelar decisiones',
  revealed: 'Cambiar un factor',
  twisted: 'Revelar tras el giro',
  twist_revealed: 'Cerrar robatalla',
  closed: '',
};

/** /arena?curso=ID — control del profesor. */
export function Arena() {
  const { teacher, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[] | null>(null);

  useEffect(() => {
    if (teacher)
      listMyCourses()
        .then(setCourses)
        .catch((e) => toast(explain(e)));
  }, [teacher]);

  if (!isOnline || (!loading && !teacher)) return <Navigate to="/profesor" replace />;
  if (!courses) return <div className="empty">Cargando…</div>;
  if (!courses.length)
    return (
      <div className="empty">
        Primero crea un curso en el <Link to="/profesor/panel">panel</Link>.
      </div>
    );

  const courseId = params.get('curso') ?? courses[0].id;
  const course = courses.find((c) => c.id === courseId) ?? courses[0];

  return (
    <section className="view">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2>Robatalla ética</h2>
          <p className="hint">
            Dos robots, un escenario que ninguno vio en el test. La clase predice desde el celular
            en <code>/votar</code>; el laboratorio revela lo que haría cada medalla.
          </p>
        </div>
        <div className="row">
          <select
            aria-label="Curso"
            value={course.id}
            onChange={(e) => setParams({ curso: e.target.value })}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.join_code}
              </option>
            ))}
          </select>
          <a
            className="btn small alt"
            href={`/pantalla?curso=${course.id}`}
            target="medalab-pantalla"
            rel="noopener"
          >
            Abrir proyección
          </a>
        </div>
      </div>
      <ArenaControl key={course.id} course={course} />
    </section>
  );
}

function ArenaControl({ course }: { course: Course }) {
  const { robots } = useCourseRobots(course.id);
  const { bout } = useCurrentBout(course.id);
  const { counts, refresh } = useVoteCounts(bout?.id);
  const pair = useBoutRobots(bout);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [s, setS] = useState(0);
  const [busy, setBusy] = useState(false);

  // Preselección: los dos primeros robots del curso.
  useEffect(() => {
    if (!a && robots[0]) setA(robots[0].row.id);
    if (!b && robots[1]) setB(robots[1].row.id);
  }, [robots, a, b]);

  const active = bout && bout.status !== 'closed' ? bout : null;
  const scenario = active ? getScenario(Number(active.scenario_id)) : null;
  const next = active && scenario ? nextStatus(active.status, !!scenario.g) : null;

  const present = async () => {
    if (!a || !b) return toast('Necesitas al menos dos robots en la galería.');
    if (a === b) return toast('Elige dos robots distintos.');
    if (active && !window.confirm('Hay una robatalla en curso. ¿Cerrarla y presentar otra?'))
      return;
    setBusy(true);
    try {
      await presentBout(course.id, a, b, s);
    } catch (e) {
      toast(explain(e));
    } finally {
      setBusy(false);
    }
  };

  const advance = async () => {
    if (!active || !next || !scenario || !pair) return;
    setBusy(true);
    try {
      await refresh(); // conteo al día antes de guardarlo
      const result = resultFor(next, active.result, {
        a: pair.A,
        b: pair.B,
        scenario,
        counts,
      });
      await advanceBout(active.id, next, result);
    } catch (e) {
      toast(explain(e));
    } finally {
      setBusy(false);
    }
  };

  const voting = active ? votingPhase(active.status) : null;

  return (
    <>
      <div className="sheet" style={{ marginBottom: 22 }}>
        <span className="stamp">{course.join_code}</span>
        <div className="grid g3">
          <div>
            <label htmlFor="arA">Robot A</label>
            <select id="arA" value={a} onChange={(e) => setA(e.target.value)}>
              {!robots.length && <option value="">Sin robots en la galería</option>}
              {robots.map(({ row, robot }) => (
                <option key={row.id} value={row.id}>
                  {robot.name} ({robot.serial})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="arB">Robot B</label>
            <select id="arB" value={b} onChange={(e) => setB(e.target.value)}>
              {!robots.length && <option value="">Sin robots en la galería</option>}
              {robots.map(({ row, robot }) => (
                <option key={row.id} value={row.id}>
                  {robot.name} ({robot.serial})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="arS">Escenario</label>
            <select id="arS" value={s} onChange={(e) => setS(Number(e.target.value))}>
              {ARENA.map((sc, i) => (
                <option key={i} value={i}>
                  {CIRCUITS[sc.c].n} · {sc.t}
                  {sc.g ? '' : ' (sin giro)'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn" type="button" onClick={present} disabled={busy}>
            Presentar el escenario
          </button>
          {active && next && (
            <button
              className={next === 'closed' ? 'btn alt' : 'btn red'}
              type="button"
              onClick={advance}
              disabled={busy || !pair}
            >
              {ACTION[active.status]}
            </button>
          )}
          {active && next !== 'closed' && active.status !== 'open' && (
            <button
              className="btn alt"
              type="button"
              onClick={() =>
                advanceBout(active.id, 'closed', active.result).catch((e) => toast(explain(e)))
              }
              disabled={busy}
            >
              Cerrar
            </button>
          )}
          {voting && (
            <span className="hint">
              {voters(counts[voting])} voto(s) {voting === 'after_twist' ? 'tras el giro' : ''}
            </span>
          )}
        </div>
      </div>

      {active && pair ? (
        <BoutView bout={active} robots={pair} counts={counts} teacher />
      ) : (
        <div className="empty">
          Sin robatalla en curso. Elige dos robots y un escenario, y preséntalo.
        </div>
      )}
    </>
  );
}
