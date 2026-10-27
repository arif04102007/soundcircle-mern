export default function Floaters({ items }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((r) => (
        <span key={r.id} className="rise absolute bottom-6 text-3xl" style={{ left: `${r.x}%` }}>{r.emoji}</span>
      ))}
    </div>
  );
}
