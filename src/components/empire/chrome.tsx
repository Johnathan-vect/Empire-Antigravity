import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { YEAR_LENGTH_DAYS } from "@/game/catalog";
import { readClock } from "@/game/clock";
import { useGame } from "@/game/store";
import { clockLabel } from "@/lib/format";
import type { CompanyStatus } from "@/game/types";

export function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5 sm:mb-4 sm:gap-2">
      <button
        type="button"
        onClick={onBack}
        className="flex size-8 sm:size-10 items-center justify-center rounded-md bg-raised/70 hover:bg-raised text-fg shrink-0 cursor-pointer"
        aria-label="Zurück"
      >
        <ChevronLeft className="size-4 sm:size-5" />
      </button>
      <h1 className="font-display text-lg sm:text-2xl tracking-tight truncate">{title}</h1>
    </div>
  );
}

export function StatusBadge({ value }: { value: number }) {
  const tone = value >= 70 ? "gain" : value >= 40 ? "warn" : "loss";
  return <Badge tone={tone}>{Math.round(value)}</Badge>;
}

export function statusLabel(status: CompanyStatus): string {
  if (status === "buyback") return "Rückkauf";
  if (status === "insolvent") return "Geschlossen";
  if (status === "paused") return "Pausiert";
  return "Aktiv";
}

export function statusTone(status: CompanyStatus): "muted" | "gain" | "loss" | "warn" {
  if (status === "buyback") return "warn";
  if (status === "insolvent") return "loss";
  if (status === "active") return "gain";
  return "muted";
}

export function HeaderClock() {
  const gameMinutes = useGame((s) => s.gameMinutes);
  const year = useGame((s) => s.year);
  const yearStartMinutes = useGame((s) => s.yearStartMinutes);
  const speed = useGame((s) => s.speed);
  const pendingYear = useGame((s) => s.pendingYearEnd);
  const clock = readClock({ year, yearStartMinutes, gameMinutes });
  const paused = speed === 0 || pendingYear;

  return (
    <div className="leading-tight min-w-0">
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted truncate">
        Jahr {clock.year} <span className="hidden sm:inline">· Wirtschaftssimulation</span>
      </p>
      <p className="tabular text-xs sm:text-sm text-fg truncate">
        Tag {clock.day}
        <span className="text-muted">
          /{YEAR_LENGTH_DAYS} · {clockLabel(clock.hour, clock.minute)}
        </span>
        {paused ? (
          <span className="ml-1.5 text-[10px] sm:text-xs font-medium text-warn">Stopp</span>
        ) : null}
      </p>
    </div>
  );
}
