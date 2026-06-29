export default function ComingSoon({
  title,
  icon,
  note,
}: {
  title: string;
  icon: string;
  note: string;
}) {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">
          {icon}
        </span>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
      </header>
      <div className="card p-8 text-center">
        <p className="text-sm text-muted">{note}</p>
      </div>
    </div>
  );
}
