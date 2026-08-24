export function PageHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tile({
  value,
  label,
  color = "var(--ink)",
}: {
  value: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <div className="card-surface rounded-xl p-4 relative overflow-hidden">
      <div className="text-3xl font-extrabold" style={{ color }}>
        {value}
      </div>
      <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">
        {label}
      </div>
      <div className="absolute left-0 bottom-0 h-1 w-full" style={{ background: color }} />
    </div>
  );
}

export function TileRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">{children}</div>;
}

export function Card({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface rounded-xl mb-5 overflow-hidden">
      <h2 className="text-sm font-bold text-navy px-4 py-3 border-b border-line flex items-center gap-2">
        {title}
        {count !== undefined && (
          <span className="text-xs font-bold bg-card-2 text-muted rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </h2>
      <div>{children}</div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Available: "bg-green/15 text-green border-green/30",
  Out: "bg-blue/15 text-blue border-blue/30",
  "In shop": "bg-amber/15 text-amber border-amber/30",
  Down: "bg-red/15 text-red border-red/30",
  Off: "bg-card-2 text-muted border-line",
};

export function StatusPill({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-card-2 text-muted border-line";
  return (
    <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full border ${cls}`}>
      {status}
    </span>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-surface border-l-4 border-l-amber rounded-lg px-4 py-3 text-sm text-ink mb-5">
      {children}
    </div>
  );
}
