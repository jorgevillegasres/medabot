import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toast } from './components/Toast';
import { isOnline } from './lib/supabase';
import { Forge, ForgeResume } from './routes/Forge/Forge';
import { Gallery } from './routes/Gallery';
import { Join } from './routes/Join';
import { Landing } from './routes/Landing';
import { Medals } from './routes/Medals';
import { MedalRoute } from './routes/Result';
import { RobotSheet } from './routes/RobotSheet';
import { Vote } from './routes/Vote';
import { useCourse } from './store/course';

// Pantallas del profesor y de impresión: los estudiantes no las descargan al entrar.
const Arena = lazy(() => import('./routes/Arena').then((m) => ({ default: m.Arena })));
const Screen = lazy(() => import('./routes/Screen').then((m) => ({ default: m.Screen })));
const TeacherLogin = lazy(() =>
  import('./routes/Teacher/Login').then((m) => ({ default: m.TeacherLogin })),
);
const TeacherPanel = lazy(() =>
  import('./routes/Teacher/Panel').then((m) => ({ default: m.TeacherPanel })),
);
const CourseSheet = lazy(() =>
  import('./routes/SheetRoutes').then((m) => ({ default: m.CourseSheet })),
);
const LocalSheet = lazy(() =>
  import('./routes/SheetRoutes').then((m) => ({ default: m.LocalSheet })),
);

export function App() {
  const course = useCourse((s) => s.course);
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    setMenu(false);
  }, [pathname]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenu(false);
      menuBtn.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);
  return (
    <>
      <header className="watch">
        <div className="wrap">
          <NavLink to="/" className="brand">
            <span className="dot" />
            MEDALAB 2045
          </NavLink>
          <button
            ref={menuBtn}
            type="button"
            className="menu-btn"
            aria-expanded={menu}
            aria-controls="menu-principal"
            onClick={() => setMenu((m) => !m)}
          >
            Menú
          </button>
          {/* Cerrar también al elegir el enlace de la página actual (ahí la ruta no cambia). */}
          <nav
            id="menu-principal"
            aria-label="Principal"
            className={menu ? 'open' : undefined}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a')) setMenu(false);
            }}
          >
            <NavLink to="/" end>
              Inicio
            </NavLink>
            <NavLink to="/forja">Forjar medalla</NavLink>
            {isOnline && course && <NavLink to="/galeria">Galería</NavLink>}
            {isOnline && course && <NavLink to="/votar">Votar</NavLink>}
            <NavLink to="/medallas">Mis medallas</NavLink>
            {isOnline && !course && <NavLink to="/entrar">Entrar al curso</NavLink>}
          </nav>
        </div>
      </header>
      <main className="wrap">
        <Suspense fallback={<div className="empty">Cargando…</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/entrar" element={<Join />} />
            <Route path="/forja" element={<ForgeResume />} />
            <Route path="/forja/:step" element={<Forge />} />
            <Route path="/medalla/:robotId" element={<MedalRoute />} />
            <Route path="/medallas" element={<Medals />} />
            <Route path="/medallas/hoja" element={<LocalSheet />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/robot/:robotId" element={<RobotSheet />} />
            <Route path="/votar" element={<Vote />} />
            <Route path="/arena" element={<Arena />} />
            <Route path="/pantalla" element={<Screen />} />
            <Route path="/profesor" element={<TeacherLogin />} />
            <Route path="/profesor/panel" element={<TeacherPanel />} />
            <Route path="/profesor/hoja" element={<CourseSheet />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="wrap foot">
        {isOnline && <Link to="/profesor">Acceso del profesor</Link>}
      </footer>
      <Toast />
    </>
  );
}
