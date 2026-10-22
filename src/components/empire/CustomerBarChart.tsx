import { useState } from "react";
import { Users, TrendingUp, Calendar } from "lucide-react";
import type { DaySnapshot } from "@/game/types";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CustomerBarChartProps {
  history: DaySnapshot[];
  todayCustomers: number;
  todayDay: number;
  className?: string;
}

export function CustomerBarChart({
  history,
  todayCustomers,
  todayDay,
  className,
}: CustomerBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Take the last 6 snapshots plus today to form up to 7 bars
  const recentHistory = (history ?? []).slice(-6);
  const data: Array<{
    day: number;
    label: string;
    customers: number;
    isToday: boolean;
  }> = [
    ...recentHistory.map((h) => ({
      day: h.day,
      label: `Tag ${h.day}`,
      customers: h.customers ?? 0,
      isToday: false,
    })),
    {
      day: todayDay,
      label: "Heute",
      customers: todayCustomers ?? 0,
      isToday: true,
    },
  ];

  const maxCustomers = Math.max(1, ...data.map((d) => d.customers));
  const totalPeriodCustomers = data.reduce((sum, d) => sum + d.customers, 0);
  const avgCustomers = Math.round(totalPeriodCustomers / data.length);

  return (
    <div
      className={cn(
        "rounded-xl bg-raised/50 p-3.5 sm:p-4 border border-[var(--border-subtle)] space-y-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Calendar className="size-3.5 text-accent" />
          <span className="font-semibold text-fg uppercase tracking-wider text-[11px]">
            Tages-Besucher-Verlauf
          </span>
          <span className="text-[11px] text-muted">
            (Letzte {data.length} Tage)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] tabular text-muted">
          <span>
            Schnitt: <b className="text-fg">{num(avgCustomers)}</b> / Tag
          </span>
          <span>
            Spitze: <b className="text-fg">{num(maxCustomers)}</b>
          </span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="relative pt-6 pb-1">
        <div className="grid grid-flow-col auto-cols-fr gap-1.5 sm:gap-2.5 items-end h-32">
          {data.map((item, idx) => {
            const heightPct = Math.max(8, Math.round((item.customers / maxCustomers) * 100));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={`${item.day}-${idx}`}
                className="group relative flex flex-col items-center h-full justify-end cursor-pointer select-none"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating tooltip/value */}
                <div
                  className={cn(
                    "absolute -top-6 text-[10px] tabular font-semibold px-1.5 py-0.5 rounded transition-all duration-150 pointer-events-none whitespace-nowrap",
                    isHovered
                      ? "opacity-100 scale-100 bg-surface text-fg shadow-md border border-[var(--border-subtle)] z-10"
                      : "opacity-80 scale-95 text-muted",
                  )}
                >
                  {num(item.customers)}
                </div>

                {/* The Bar */}
                <div className="w-full h-full flex items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all duration-300 relative overflow-hidden",
                      item.isToday
                        ? "bg-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)] ring-1 ring-accent/60"
                        : item.customers > 0
                          ? "bg-gain/60 group-hover:bg-gain/80"
                          : "bg-surface/60 group-hover:bg-surface",
                      isHovered && "brightness-110",
                    )}
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Subtle highlight sheen */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
                  </div>
                </div>

                {/* Day Label */}
                <span
                  className={cn(
                    "mt-2 text-[10px] sm:text-[11px] truncate tracking-tight transition-colors",
                    item.isToday
                      ? "font-bold text-accent"
                      : isHovered
                        ? "text-fg font-medium"
                        : "text-muted",
                  )}
                >
                  {item.isToday ? "Heute" : `T${item.day}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info / Legend */}
      <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between text-[11px] text-muted gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-accent inline-block" />
            <span>Aktueller Spieltag</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-gain/60 inline-block" />
            <span>Abgeschlossene Tage</span>
          </div>
        </div>
        <span className="italic text-[10px]">
          Tagesabschluss archiviert um 00:00 Uhr
        </span>
      </div>
    </div>
  );
}
