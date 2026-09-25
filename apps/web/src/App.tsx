import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Toast } from './components/Toast';
import { Forge } from './routes/Forge/Forge';
import { Landing } from './routes/Landing';
import { Medals } from './routes/Medals';
import { MedalRoute } from './routes/Result';

export function App() {
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
            <NavLink to="/medallas">Mis medallas</NavLink>
          </nav>
        </div>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/forja" element={<Navigate to="/forja/1" replace />} />
          <Route path="/forja/:step" element={<Forge />} />
          <Route path="/medalla/:robotId" element={<MedalRoute />} />
          <Route path="/medallas" element={<Medals />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toast />
    </>
  );
}
