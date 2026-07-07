export default function ProgressRing({
  pct,
  size = 64,
  stroke = 7,
  color = "#4D7CFF",
  children,
}: {
  /** 0–100, or null for "nothing to measure" (renders an empty track). */
  pct: number | null;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const clamped = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-line"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-ink">{children}</span>
    </div>
  );
}
