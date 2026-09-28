import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Toast } from './components/Toast';
import { isOnline } from './lib/supabase';
import { Arena } from './routes/Arena';
import { Forge, ForgeResume } from './routes/Forge/Forge';
import { Gallery } from './routes/Gallery';
import { Join } from './routes/Join';
import { Landing } from './routes/Landing';
import { Medals } from './routes/Medals';
import { MedalRoute } from './routes/Result';
import { RobotSheet } from './routes/RobotSheet';
import { Screen } from './routes/Screen';
import { CourseSheet, LocalSheet } from './routes/SheetRoutes';
import { TeacherLogin } from './routes/Teacher/Login';
import { TeacherPanel } from './routes/Teacher/Panel';
import { Vote } from './routes/Vote';
import { useCourse } from './store/course';

export function App() {
  const course = useCourse((s) => s.course);
  return (
    <>
      <header className="watch">
        <div className="wrap">
          <NavLink to="/" className="brand">
            <span className="dot" />
            MEDALAB 2045
          </NavLink>
          <nav aria-label="Principal">
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
      </main>
      <footer className="wrap foot">
        {isOnline && <Link to="/profesor">Acceso del profesor</Link>}
      </footer>
      <Toast />
    </>
  );
}
