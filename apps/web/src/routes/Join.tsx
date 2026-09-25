import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { joinCourse } from '../lib/api';
import { explain, isOnline } from '../lib/supabase';
import { useCourse } from '../store/course';
import { useDraft } from '../store/draft';

/** /entrar?c=CODIGO — código de curso + nombre. Sin cuenta ni email. */
export function Join() {
  const [params] = useSearchParams();
  const course = useCourse((s) => s.course);
  const join = useCourse((s) => s.join);
  const leave = useCourse((s) => s.leave);
  const setDraft = useDraft((s) => s.set);
  const author = useDraft((s) => s.draft.author);
  const navigate = useNavigate();
  const [code, setCode] = useState(params.get('c') ?? '');
  const [name, setName] = useState(course?.author ?? author);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isOnline)
    return (
      <section className="view">
        <div className="empty">
          Este laboratorio funciona en modo local: no hay servidor de curso configurado.
        </div>
      </section>
    );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const c = await joinCourse(code, name);
      join({ id: c.id, name: c.name, joinCode: c.join_code, author: name.trim() });
      if (!author.trim()) setDraft({ author: name.trim() });
      navigate('/forja/1');
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="view">
      <form className="sheet" style={{ maxWidth: 520, margin: '0 auto' }} onSubmit={submit}>
        <span className="stamp">Entrar al curso</span>
        <h2>Laboratorio del curso</h2>
        {course && (
          <p className="hint">
            Ahora estás en <b>{course.name}</b> ({course.joinCode}).{' '}
            <button type="button" className="linkbtn" onClick={leave}>
              Salir del curso
            </button>
          </p>
        )}
        <label htmlFor="jCode">Código del curso</label>
        <input
          type="text"
          id="jCode"
          placeholder="Ej. KBT-2045"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={12}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <label htmlFor="jName">Tu nombre o el de tu dupla</label>
        <input
          type="text"
          id="jName"
          maxLength={60}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="hint">
          No necesitas cuenta ni correo. Tu robot quedará asociado a este navegador.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" type="submit" disabled={busy || !code.trim() || !name.trim()}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </section>
  );
}
