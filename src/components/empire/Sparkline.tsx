import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  className,
  positive,
}: {
  values: number[];
  className?: string;
  positive?: boolean;
}) {
  if (values.length < 2) {
    return <div className={cn("h-10", className)} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 120;
  const h = 40;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = positive ?? values[values.length - 1]! >= values[0]!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-10 w-full", className)} aria-hidden>
      <polyline
        fill="none"
        stroke={up ? "var(--empire-gain)" : "var(--empire-loss)"}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}
