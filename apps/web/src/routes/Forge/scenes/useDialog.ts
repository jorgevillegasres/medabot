import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal accesible: pone el foco inicial, mantiene Tab dentro del diálogo,
 * Escape llama a onEscape y, al cerrarse, devuelve el foco a donde estaba.
 */
export function useDialog(
  dialog: RefObject<HTMLElement | null>,
  onEscape: () => void,
  initial?: RefObject<HTMLElement | null>,
) {
  const escape = useRef(onEscape);
  useEffect(() => {
    escape.current = onEscape;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    (initial?.current ?? dialog.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        escape.current();
        return;
      }
      const root = dialog.current;
      if (e.key !== 'Tab' || !root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = root.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener?.isConnected) opener.focus();
    };
    // Solo al abrir/cerrar: dialog/initial son refs estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
