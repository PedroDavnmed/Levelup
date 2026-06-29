export default function StatCard({
  label,
  value,
  sub,
  accent = "text-ink",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
