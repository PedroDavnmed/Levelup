export default function PageHeader({
  title,
  icon,
  subtitle,
  action,
}: {
  title: string;
  icon: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl shrink-0">
          {icon}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}
