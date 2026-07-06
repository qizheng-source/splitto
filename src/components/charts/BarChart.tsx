import { fromCents } from "@/lib/money";

const CATEGORICAL_LIGHT = [
  "#2a78d6",
  "#1baf7a",
  "#eda100",
  "#008300",
  "#4a3aa7",
  "#e34948",
  "#e87ba4",
  "#eb6834",
];
const CATEGORICAL_DARK = [
  "#3987e5",
  "#199e70",
  "#c98500",
  "#008300",
  "#9085e9",
  "#e66767",
  "#d55181",
  "#d95926",
];

export function BarChart({
  title,
  bars,
  currency,
}: {
  title: string;
  bars: { label: string; cents: number }[];
  currency: string;
}) {
  if (bars.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        <p className="text-sm text-zinc-400 dark:text-zinc-600">No data yet.</p>
      </div>
    );
  }

  const max = Math.max(...bars.map((b) => b.cents), 1);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
      <div className="flex flex-col gap-2">
        {bars.map((bar, index) => {
          const widthPct = Math.max((bar.cents / max) * 100, 3);
          const light = CATEGORICAL_LIGHT[index % CATEGORICAL_LIGHT.length];
          const dark = CATEGORICAL_DARK[index % CATEGORICAL_DARK.length];
          return (
            <div key={bar.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs text-zinc-600 dark:text-zinc-400">
                {bar.label}
              </span>
              <div className="relative h-4 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-4 rounded-r-[4px] rounded-l-sm"
                  style={{ width: `${widthPct}%`, backgroundColor: light, ["--dark-bg" as string]: dark }}
                  data-bar
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs text-zinc-700 dark:text-zinc-300">
                {fromCents(bar.cents)} {currency}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @media (prefers-color-scheme: dark) {
          [data-bar] { background-color: var(--dark-bg) !important; }
        }
      `}</style>
    </div>
  );
}
