import { Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useGame } from "@/game/store";
import { DEFAULT_MACRO } from "@/game/catalog";

export function MacroTicker() {
  const macro = useGame((s) => s.market.macro) ?? DEFAULT_MACRO;
  const openMacroDrawer = useGame((s) => s.openMacroDrawer);

  const cycleIcon =
    macro.cycle === "boom" ? (
      <TrendingUp className="size-3 text-accent shrink-0" />
    ) : macro.cycle === "recession" ? (
      <TrendingDown className="size-3 text-warn shrink-0" />
    ) : (
      <Minus className="size-3 text-muted shrink-0" />
    );

  const cycleText =
    macro.cycle === "boom"
      ? "Boom ↗"
      : macro.cycle === "recession"
        ? "Rezession ↘"
        : "Stabil →";

  const cycleTone =
    macro.cycle === "boom"
      ? "text-accent bg-accent/10 border-accent/30"
      : macro.cycle === "recession"
        ? "text-warn bg-warn/10 border-warn/30"
        : "text-muted bg-surface border-border";

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-2.5 sm:px-4 border-t border-border/40 bg-surface/40 text-[11px]">
      <button
        type="button"
        onClick={() => openMacroDrawer(true)}
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium transition-all hover:bg-raised cursor-pointer shrink-0"
        title="Details zur Gesamtwirtschaft öffnen"
      >
        <Globe className="size-3 text-muted shrink-0" />
        <span className="text-muted font-normal">Konjunktur:</span>
        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border ${cycleTone}`}>
          {cycleIcon}
          <span>{cycleText}</span>
        </span>
      </button>

      <div className="h-3 w-px bg-border/60 shrink-0" />

      <button
        type="button"
        onClick={() => openMacroDrawer(true)}
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-all hover:bg-raised cursor-pointer shrink-0"
      >
        <span className="text-muted">EZB-Zins:</span>
        <span className="tabular font-medium text-fg">
          {(macro.interestRate * 100).toFixed(1)} %
        </span>
      </button>

      <div className="h-3 w-px bg-border/60 shrink-0" />

      <button
        type="button"
        onClick={() => openMacroDrawer(true)}
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-all hover:bg-raised cursor-pointer shrink-0"
      >
        <span className="text-muted">Inflation:</span>
        <span className="tabular font-medium text-fg">
          {(macro.inflationRate * 100).toFixed(1)} %
        </span>
      </button>
    </div>
  );
}
