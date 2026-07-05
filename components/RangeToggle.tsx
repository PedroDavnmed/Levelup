"use client";

/** Small segmented control for choosing a chart window (7 / 14 / 30 days). */
export default function RangeToggle({
  value,
  onChange,
  options = [7, 14, 30],
}: {
  value: number;
  onChange: (n: number) => void;
  options?: number[];
}) {
  return (
    <div
      role="group"
      aria-label="Time range"
      className="inline-flex rounded-lg border border-line p-0.5"
    >
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            value === n
              ? "bg-brand-500 text-white"
              : "text-muted hover:text-ink"
          }`}
        >
          {n}d
        </button>
      ))}
    </div>
  );
}
