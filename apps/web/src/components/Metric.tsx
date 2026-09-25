export function Metric({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b>{value ?? '—'}</b>
    </div>
  );
}
