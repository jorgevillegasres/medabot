import { Component, type ReactNode } from 'react';

/** Si una escena no se puede cargar (p. ej. sin conexión tras una actualización), ofrece la forja clásica. */
export class SceneBoundary extends Component<
  { onClassic: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="empty" role="alert">
        <p>No se pudo cargar esta escena. Tus respuestas están guardadas.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn" onClick={this.props.onClassic}>
            Ver como formulario
          </button>
          <button type="button" className="btn alt" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }
}
