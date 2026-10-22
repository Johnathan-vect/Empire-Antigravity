import { useGame } from "@/game/store";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Delta } from "./Delta";
import { Sparkline } from "./Sparkline";

export function InsolvencyScreen() {
  const report = useGame((s) => s.insolvency);
  const career = useGame((s) => s.career);
  const restart = useGame((s) => s.restart);
  if (!report) return null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <p className="text-xs uppercase tracking-wider text-loss">Insolvenz</p>
      <h1 className="mt-1 font-display text-4xl tracking-tight">Spielstand beendet</h1>
      <p className="mt-3 text-sm text-muted">
        Zahlungsunfähigkeit nach {report.days} Tagen in Geschäftsjahr {report.year}.
      </p>

      <div className="mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs text-muted">Vermögensverlauf</p>
        <Sparkline className="mt-2 h-16" values={report.history.map((p) => p.v)} />
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-muted">Hoch</span>
          <span className="tabular">{money(report.peakNet)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Ende</span>
          <Delta value={report.endNet} withLabel={false} />
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <Row k="Unternehmen" v={report.fromCompanies} />
        <Row k="Aktien" v={report.fromStocks} />
        <Row k="Lebenshaltung" v={report.fromLiving} />
        <Row k="Besitz (Restwert)" v={report.fromAssets} />
      </dl>

      <div className="mt-6 rounded-xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]">
        <p className="font-medium">Karriere</p>
        <p className="mt-1 text-muted">
          Stufe {career.level} · {career.runs} Läufe · verdient {money(career.totalEarned)}
        </p>
      </div>

      <Button className="mt-8" onClick={restart}>
        Neuer Versuch
      </Button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{k}</dt>
      <dd>
        <Delta value={v} withLabel={false} />
      </dd>
    </div>
  );
}
