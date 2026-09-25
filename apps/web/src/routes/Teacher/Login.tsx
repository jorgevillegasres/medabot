import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { explain, isOnline, supabase } from '../../lib/supabase';

/** /profesor — acceso del profesor con enlace mágico al correo. */
export function TeacherLogin() {
  const { teacher, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOnline)
    return (
      <section className="view">
        <div className="empty">
          Modo local: no hay servidor configurado para el panel del profesor.
        </div>
      </section>
    );
  if (loading) return null;
  if (teacher) return <Navigate to="/profesor/panel" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase!.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/profesor/panel` },
    });
    setBusy(false);
    if (error) setError(explain(error));
    else setSent(true);
  };

  return (
    <section className="view">
      <form className="sheet" style={{ maxWidth: 520, margin: '0 auto' }} onSubmit={submit}>
        <span className="stamp">Sr. Referí</span>
        <h2>Acceso del profesor</h2>
        {sent ? (
          <p>
            Te enviamos un enlace a <b>{email}</b>. Ábrelo en este mismo navegador para entrar al
            panel.
          </p>
        ) : (
          <>
            <label htmlFor="tEmail">Correo</label>
            <input
              type="email"
              id="tEmail"
              className="input"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="hint">Recibirás un enlace para entrar, sin contraseña.</p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn" type="submit" disabled={busy || !email.trim()}>
                {busy ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
