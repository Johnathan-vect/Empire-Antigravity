import { Clock, RotateCcw, Store } from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { formatGameTimestamp } from "@/game/clock";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EventModal() {
  const ev = useGame((s) => s.pendingEvent);
  const resolvePending = useGame((s) => s.resolvePendingEvent);
  const openCompany = useGame((s) => s.openCompany);
  const setCompanyTab = useGame((s) => s.setCompanyTab);
  if (!ev || typeof document === "undefined") return null;

  const kicker =
    ev.kind === "critical"
      ? "Entscheidung erforderlich"
      : ev.kind === "warning"
        ? "Wichtige Betriebsmeldung"
        : "Hinweis";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center empire-scrim p-3 sm:p-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-4 sm:p-6 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-warn">{kicker}</p>
          <span className="inline-flex items-center gap-1 rounded bg-raised px-2 py-0.5 text-[11px] tabular text-muted">
            <Clock className="size-3 text-accent" />
            {formatGameTimestamp(ev.createdAt)}
          </span>
        </div>
        <h2 className="mt-1.5 font-display text-xl sm:text-2xl tracking-tight">{ev.title}</h2>
        <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">{ev.body}</p>
        {ev.options.length > 0 ? (
          <div className="mt-4 space-y-2">
            {ev.options.map((opt) => {
              const isBuyback = opt.id === "buyback-supplier";
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const err = resolvePending(opt.id);
                    if (err) {
                      toast.error(err);
                    } else if (isBuyback) {
                      toast.success("Lieferant erfolgreich zurückgekauft!");
                    }
                  }}
                  className={cn(
                    "flex w-full flex-col items-start rounded-lg px-3.5 py-2.5 text-left transition-colors duration-150 cursor-pointer border",
                    isBuyback
                      ? "bg-accent/15 border-accent/40 hover:bg-accent hover:text-accent-fg"
                      : "bg-raised border-[var(--border-subtle)] hover:bg-accent hover:text-accent-fg",
                  )}
                >
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                    {isBuyback ? <RotateCcw className="size-3.5 shrink-0" /> : null}
                    <span>{opt.label}</span>
                  </span>
                  <span className="mt-0.5 text-[11px] opacity-80">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2">
            {ev.companyId ? (
              <Button
                variant="secondary"
                className="flex-1 gap-1.5"
                onClick={() => {
                  const cid = ev.companyId!;
                  const isProductEvt =
                    ev.title.includes("Liefer") || Boolean(ev.productId);
                  resolvePending("ack");
                  openCompany(cid);
                  if (isProductEvt) setCompanyTab("products");
                }}
              >
                <Store className="size-4" />
                <span>Direkt zum Betrieb</span>
              </Button>
            ) : null}
            <Button className="flex-1" onClick={() => resolvePending("ack")}>
              Verstanden
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
