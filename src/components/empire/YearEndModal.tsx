import { createPortal } from "react-dom";
import { YEAR_LENGTH_DAYS, yearThreshold } from "@/game/catalog";
import { readClock } from "@/game/clock";
import { netWorth, personalDebtTotal } from "@/game/sim";
import { useGame } from "@/game/store";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function YearEndModal() {
  const pending = useGame((s) => s.pendingYearEnd);
  const seenWelcome = useGame((s) => s.seenWelcome);
  const s = useGame();
  const confirm = useGame((st) => st.confirmYear);
  if (!pending || !seenWelcome || typeof document === "undefined") return null;
  const clock = readClock(s);
  const forced = clock.day >= YEAR_LENGTH_DAYS;
  const nw = netWorth(s);
  const personal = personalDebtTotal(s);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center empire-scrim p-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <p className="text-xs uppercase tracking-wider text-warn">Jahreskante</p>
        <h2 className="mt-1 font-display text-2xl tracking-tight">
          {forced ? "Tag 360 — Geschäftsjahr endet" : "Vorzeitiges Jahresende"}
        </h2>
        <p className="mt-3 text-sm text-muted">
          Die Zeit steht. Du kannst noch einlegen, tilgen und Preise ändern. Erst mit Bestätigen
          wechseln Markt und Jahr.
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Gesamtvermögen</dt>
            <dd className="tabular">{money(nw)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Vorjahr-Schwelle</dt>
            <dd className="tabular">{money(yearThreshold(s.yearNetWorthBase))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Privatkonto</dt>
            <dd className="tabular">{money(s.cash)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Privatschulden</dt>
            <dd className="tabular">{money(personal)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-faint">
          Firmen mit Kasse unter 0 werden pleite und wandern in den Rückkauf. Run-Ende nur, wenn
          privat nichts mehr bedienbar ist.
        </p>
        <Button className="mt-5 w-full" onClick={confirm}>
          Jahr abschließen
        </Button>
      </div>
    </div>,
    document.body,
  );
}
