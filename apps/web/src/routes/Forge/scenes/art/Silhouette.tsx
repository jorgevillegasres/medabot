/** Personaje genérico del lugar: sin nombre ni rasgos, solo el color del distrito. */
export function Silhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 100" className="silhouette" aria-hidden="true">
      <circle cx="40" cy="26" r="16" fill={color} stroke="#1B1B2F" strokeWidth="3" />
      <path d="M12 96 C12 58 68 58 68 96 Z" fill={color} stroke="#1B1B2F" strokeWidth="3" />
    </svg>
  );
}
