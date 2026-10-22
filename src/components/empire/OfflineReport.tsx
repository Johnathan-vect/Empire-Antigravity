import { createPortal } from "react-dom";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { Delta } from "./Delta";

export function OfflineReport() {
  const report = useGame((s) => s.offlineReport);
  const dismiss = useGame((s) => s.dismissOffline);
  const seenWelcome = useGame((s) => s.seenWelcome);
  if (!report || !seenWelcome || typeof document === "undefined") return null;

  const hours = Math.round(report.gameHours);
  const realH = Math.round(report.realMs / 3_600_000);
  const realM = Math.round(report.realMs / 60_000);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center empire-scrim p-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <p className="text-xs uppercase tracking-wider text-muted">Während du weg warst</p>
        <h2 className="mt-1 font-display text-2xl tracking-tight">{hours} Spielstunden</h2>
        <p className="text-xs text-faint">
          {report.stoppedAtYearEnd
            ? "An der Jahreskante gestoppt — das Jahr endet nicht von selbst."
            : realH >= 1
              ? `${realH} Std. reale Pause`
              : `${realM} Min. reale Pause`}
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <Line k="Unternehmen" v={report.companyProfit} />
          <Line k="Depot" v={report.stockDelta} />
          <Line k="Lebenshaltung" v={-report.living} />
          <div className="flex items-center justify-between border-t border-border pt-2">
            <dt className="font-medium">Gesamtergebnis</dt>
            <dd>
              <Delta value={report.result} />
            </dd>
          </div>
        </dl>
        <Button className="mt-5 w-full" onClick={dismiss}>
          Weiter
        </Button>
      </div>
    </div>,
    document.body,
  );
}

function Line({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{k}</dt>
      <dd>
        <Delta value={v} withLabel={false} />
      </dd>
    </div>
  );
}
