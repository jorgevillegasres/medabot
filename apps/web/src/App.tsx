import { DILEMMAS, ARENA, TYPES } from '@medalab/content';

// Pantalla provisional de la Fase 0: confirma que la app consume el paquete de contenido.
// Las rutas reales (Landing, Forja, Resultado…) llegan en la Fase 1.
export function App() {
  return (
    <>
      <header className="watch">
        <div className="wrap">
          <div className="brand">
            <span className="dot" />
            MEDALAB 2045
          </div>
        </div>
      </header>
      <main className="wrap">
        <div className="sheet" style={{ marginTop: 28 }}>
          <span className="stamp">Fase 0</span>
          <h1>El cuerpo se compra en la tienda. La medalla, no.</h1>
          <p className="hint">
            Contenido cargado: {DILEMMAS.length} dilemas, {ARENA.length} escenarios, {TYPES.length}{' '}
            tipos de robot.
          </p>
        </div>
      </main>
    </>
  );
}
