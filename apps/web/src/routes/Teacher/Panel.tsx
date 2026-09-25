import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CIRCUITS, SCHOOLS, STAGE_NAMES, TYPES, getType, type SchoolKey } from '@medalab/content';
import { importRobots } from '@medalab/engine';
import { downloadBlob } from '@medalab/ui';
import {
  createCourse,
  deleteRobot,
  importToCourse,
  listMyCourses,
  setGalleryClosed,
  useCourseRobots,
  type Course,
  type PublishedRobot,
} from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { explain, isOnline, supabase } from '../../lib/supabase';
import { groupStats, robotsToCsv } from '../../lib/teacher';
import { toast } from '../../store/toast';

const SCHOOL_KEYS = Object.keys(SCHOOLS) as SchoolKey[];

/** /profesor/panel — cursos, robots con datos ocultos, agregados del grupo. */
export function TeacherPanel() {
  const { teacher, loading, session } = useAuth();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!teacher) return;
    listMyCourses()
      .then((cs) => {
        setCourses(cs);
        setSelected((s) => s ?? cs[0]?.id ?? null);
      })
      .catch((e) => toast(explain(e)));
  }, [teacher]);

  if (!isOnline || (!loading && !teacher)) return <Navigate to="/profesor" replace />;
  if (loading || !courses) return <div className="empty">Cargando…</div>;

  const course = courses.find((c) => c.id === selected) ?? null;
  const replaceCourse = (c: Course) => setCourses((cs) => cs!.map((x) => (x.id === c.id ? c : x)));

  return (
    <section className="view">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h2>Panel del profesor</h2>
          <p className="hint">{session?.user.email}</p>
        </div>
        <button className="btn small alt" type="button" onClick={() => supabase!.auth.signOut()}>
          Salir
        </button>
      </div>

      <CourseBar
        courses={courses}
        selected={selected}
        onSelect={setSelected}
        onCreated={(c) => {
          setCourses([c, ...courses]);
          setSelected(c.id);
        }}
      />

      {course && <CourseView key={course.id} course={course} onCourse={replaceCourse} />}
    </section>
  );
}

function CourseBar(props: {
  courses: Course[];
  selected: string | null;
  onSelect: (id: string) => void;
  onCreated: (c: Course) => void;
}) {
  const [name, setName] = useState('');
  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      props.onCreated(await createCourse(name.trim()));
      setName('');
      toast('Curso creado.');
    } catch (err) {
      toast(explain(err));
    }
  };
  return (
    <div className="sheet">
      <span className="stamp">Cursos</span>
      <div className="grid g2">
        <div>
          <label htmlFor="pCourse">Curso</label>
          <select
            id="pCourse"
            value={props.selected ?? ''}
            onChange={(e) => props.onSelect(e.target.value)}
            disabled={!props.courses.length}
          >
            {!props.courses.length && <option value="">Aún no tienes cursos</option>}
            {props.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.join_code}
              </option>
            ))}
          </select>
        </div>
        <form onSubmit={create}>
          <label htmlFor="pNew">Crear curso</label>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input
              type="text"
              id="pNew"
              placeholder="Ética y Legislación en Datos · 535213"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn small" type="submit" disabled={!name.trim()}>
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CourseView({ course, onCourse }: { course: Course; onCourse: (c: Course) => void }) {
  const { robots, loading, error } = useCourseRobots(course.id);
  const joinUrl = `${window.location.origin}/entrar?c=${course.join_code}`;

  const toggleGallery = async () => {
    try {
      onCourse(await setGalleryClosed(course.id, !course.gallery_closed));
      toast(course.gallery_closed ? 'Galería abierta.' : 'Galería cerrada.');
    } catch (e) {
      toast(explain(e));
    }
  };

  return (
    <>
      <div className="sheet">
        <span className="stamp">
          {course.gallery_closed ? 'Galería cerrada' : 'Galería abierta'}
        </span>
        <div className="grid g2">
          <div>
            <p className="hint" style={{ margin: 0 }}>
              Código de unión
            </p>
            <p className="joincode" data-testid="join-code">
              {course.join_code}
            </p>
            <p className="hint">
              Enlace para los estudiantes: <code>{joinUrl}</code>
            </p>
            <div className="row">
              <button
                className="btn small alt"
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(joinUrl).then(() => toast('Enlace copiado.'))
                }
              >
                Copiar enlace
              </button>
              <Link className="btn small" to={`/arena?curso=${course.id}`}>
                Ir a la Arena
              </Link>
              <button
                className={course.gallery_closed ? 'btn small' : 'btn small red'}
                type="button"
                onClick={toggleGallery}
              >
                {course.gallery_closed ? 'Abrir galería' : 'Cerrar galería'}
              </button>
            </div>
            <p className="hint">
              Con la galería cerrada nadie puede publicar ni editar robots, salvo tú.
            </p>
          </div>
          <ImportBox course={course} existing={robots} />
        </div>
      </div>

      {error ? (
        <div className="empty" role="alert">
          {explain(error)}
        </div>
      ) : loading ? (
        <div className="empty">Cargando robots…</div>
      ) : (
        <>
          <Aggregates robots={robots} />
          <RobotTable course={course} robots={robots} />
        </>
      )}
    </>
  );
}

function ImportBox({ course, existing }: { course: Course; existing: PublishedRobot[] }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const doImport = async () => {
    const ids = existing.flatMap(({ row }) => [row.id, row.legacy_id ?? '']);
    const parsed = importRobots(text, { existingIds: ids });
    if (!parsed.length) return toast('No se reconoció ningún código válido nuevo.');
    setBusy(true);
    const { ok, failed } = await importToCourse(parsed, course.id);
    setBusy(false);
    setText('');
    toast(
      `${ok.length} robot(s) importado(s)` +
        (failed.length ? `; ${failed.length} con error: ${explain(failed[0].error)}` : '.'),
    );
  };
  return (
    <div>
      <label htmlFor="pImport">Importar códigos o JSON del MVP</label>
      <textarea
        id="pImport"
        style={{ minHeight: 110 }}
        placeholder="Un código por línea, o el JSON exportado"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <button
          className="btn small"
          type="button"
          onClick={doImport}
          disabled={busy || !text.trim()}
        >
          {busy ? 'Importando…' : 'Importar'}
        </button>
      </div>
    </div>
  );
}

function Aggregates({ robots }: { robots: PublishedRobot[] }) {
  const s = useMemo(() => groupStats(robots.map((p) => p.robot)), [robots]);
  const bar = (v: number) => ({ width: s.total ? `${(v / s.total) * 100}%` : '0%' });
  return (
    <div className="sheet">
      <span className="stamp">Agregados del grupo</span>
      {!s.total ? (
        <p className="hint">Todavía no hay robots en este curso.</p>
      ) : (
        <div className="grid g3">
          <div>
            <h3>Escuelas éticas</h3>
            {SCHOOL_KEYS.map((k) => (
              <div className="barrow" key={k}>
                <span>
                  {SCHOOLS[k].n} <small>({SCHOOLS[k].t})</small>
                </span>
                <span className="bar">
                  <i style={bar(s.schools[k])} />
                </span>
                <b>{s.schools[k]}</b>
              </div>
            ))}
          </div>
          <div>
            <h3>Niveles de Kohlberg</h3>
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div className="barrow" key={k}>
                <span>
                  {k}. {STAGE_NAMES[k]}
                </span>
                <span className="bar">
                  <i style={bar(s.stages[k])} />
                </span>
                <b>{s.stages[k]}</b>
              </div>
            ))}
          </div>
          <div>
            <h3>Promedios</h3>
            <div className="metric">
              <span>Robots</span>
              <b>{s.total}</b>
            </div>
            <div className="metric">
              <span>Coherencia media</span>
              <b>{s.avgCoherence}%</b>
            </div>
            <div className="metric">
              <span>Compatibilidad media</span>
              <b>{s.avgCompat}%</b>
            </div>
            <div className="metric">
              <span>Eje más valorado</span>
              <b>
                {s.axes[0].n} ({s.axes[0].avg})
              </b>
            </div>
            <div className="metric">
              <span>Eje menos valorado</span>
              <b>
                {s.axes[5].n} ({s.axes[5].avg})
              </b>
            </div>
            <div className="metric">
              <span>Con contradicción</span>
              <b>{s.withContra.length}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RobotTable({ course, robots }: { course: Course; robots: PublishedRobot[] }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [school, setSchool] = useState('');
  const [onlyContra, setOnlyContra] = useState(false);

  const shown = robots.filter(({ robot: r }) => {
    const text = `${r.name} ${r.author} ${r.serial}`.toLowerCase();
    return (
      (!q || text.includes(q.toLowerCase())) &&
      (!type || r.type === type) &&
      (!school || r.school === school) &&
      (!onlyContra || r.contra.length > 0)
    );
  });

  const remove = async (p: PublishedRobot) => {
    if (!window.confirm(`¿Eliminar a ${p.robot.name} (${p.robot.serial}) de la galería?`)) return;
    try {
      await deleteRobot(p.row.id);
      toast('Robot eliminado.');
    } catch (e) {
      toast(explain(e));
    }
  };

  const exportCsv = () =>
    downloadBlob(
      new Blob([robotsToCsv(shown.map((p) => p.robot))], { type: 'text/csv;charset=utf-8' }),
      `medalab-${course.join_code}.csv`,
    );
  const exportJson = () =>
    downloadBlob(
      new Blob(
        [
          JSON.stringify(
            shown.map((p) => p.robot),
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      ),
      `medalab-${course.join_code}.json`,
    );

  return (
    <div className="sheet">
      <span className="stamp">Robots · {robots.length}</span>
      <div className="grid g3" style={{ alignItems: 'end' }}>
        <div>
          <label htmlFor="fq">Buscar</label>
          <input type="text" id="fq" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ft">Tipo</label>
          <select id="ft" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos</option>
            {TYPES.map((t) => (
              <option key={t.c} value={t.c}>
                {t.n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fs">Escuela</label>
          <select id="fs" value={school} onChange={(e) => setSchool(e.target.value)}>
            <option value="">Todas</option>
            {SCHOOL_KEYS.map((k) => (
              <option key={k} value={k}>
                {SCHOOLS[k].n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="row" style={{ margin: '12px 0' }}>
        <label className="check">
          <input
            type="checkbox"
            checked={onlyContra}
            onChange={(e) => setOnlyContra(e.target.checked)}
          />
          Solo con contradicción
        </label>
        <span style={{ flex: 1 }} />
        <button
          className="btn small alt"
          type="button"
          onClick={exportCsv}
          disabled={!shown.length}
        >
          Exportar CSV
        </button>
        <button
          className="btn small alt"
          type="button"
          onClick={exportJson}
          disabled={!shown.length}
        >
          Exportar JSON
        </button>
      </div>
      <div className="tablewrap">
        <table className="table">
          <thead>
            <tr>
              <th>Robot</th>
              <th>Autor</th>
              <th>Tipo</th>
              <th>Escuela</th>
              <th>Coher.</th>
              <th>Compat.</th>
              <th>Evolución</th>
              <th>Circuito</th>
              <th>Contradicción</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const r = p.robot;
              return (
                <tr key={p.row.id}>
                  <td>
                    <Link to={`/robot/${p.row.id}`}>{r.name}</Link>
                    <br />
                    <small>{r.serial}</small>
                  </td>
                  <td>{r.author}</td>
                  <td>{getType(r.type)?.n}</td>
                  <td>{SCHOOLS[r.school]?.n}</td>
                  <td>{r.coherence}%</td>
                  <td>{r.compat}%</td>
                  <td>
                    {r.evo}
                    <br />
                    <small>
                      etapa {r.stage} · {STAGE_NAMES[Math.round(r.stage)] ?? ''}
                    </small>
                  </td>
                  <td>{CIRCUITS[r.circuit]?.n}</td>
                  <td>{r.contra.join(' y ') || '—'}</td>
                  <td>
                    <button
                      className="btn small red"
                      type="button"
                      onClick={() => remove(p)}
                      aria-label={`Eliminar ${r.name}`}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!shown.length && <p className="hint">Ningún robot coincide con los filtros.</p>}
      </div>
    </div>
  );
}
