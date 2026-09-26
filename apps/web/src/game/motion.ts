import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** true si el sistema pide menos movimiento: las escenas saltan sus animaciones. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia(QUERY).matches,
  );
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const m = matchMedia(QUERY);
    const onChange = () => setReduced(m.matches);
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
