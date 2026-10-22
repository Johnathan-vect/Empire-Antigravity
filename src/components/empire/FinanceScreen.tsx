import { HINTS, LIVING_PER_DAY, POSSESSIONS, yearThreshold } from "@/game/catalog";
import {
  collectionValue,
  cryptoValue,
  dailyDividendEstimate,
  debtRemaining,
  personalDebtTotal,
  realEstateValue,
  stockValue,
  totalDailyRent,
} from "@/game/sim";
import { availableCredit, netWorth, useGame, usedCredit } from "@/game/store";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Delta, Money } from "./Delta";
import { useState } from "react";
import { toast } from "sonner";

export function FinanceScreen() {
  const s = useGame();
  const debt = debtRemaining(s);
  const personal = personalDebtTotal(s);
  const used = usedCredit(s);
  const avail = availableCredit(s);
  const limit = s.creditLimit;
  const bound = s.companies.reduce((a, c) => a + c.cash, 0);
  const depot = stockValue(s);
  const crypto = cryptoValue(s);
  const realEstate = realEstateValue(s);
  const collections =
    collectionValue(s) +
    s.possessions.reduce((acc, id) => {
      const p = POSSESSIONS.find((x) => x.id === id);
      return acc + (p ? p.price : 0);
    }, 0);
  const dailyRent = totalDailyRent(s);
  const dailyDiv = dailyDividendEstimate(s);
  const nw = netWorth(s);
  const tight = used / Math.max(1, limit) >= 0.8;
  const red = s.companies.some((c) => c.status === "active" && c.cash < 0);
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [xfer, setXfer] = useState<Record<string, string>>({});

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Finanzen</h1>
        <span className="text-[11px] text-muted tabular">
          Freier Kreditrahmen: <b className="text-fg">{money(avail)}</b>
        </span>
      </header>

      <section className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <Tile label="Privatkonto" value={s.cash} />
        <Tile label="Firmenkassen" value={bound} />
        <Tile label="Aktiendepot" value={depot} />
        <Tile label="Krypto-Wallet" value={crypto} />
        <Tile label="Immobilien" value={realEstate} />
        <Tile label="Besitz & Kunst" value={collections} />
        <Tile label="Schulden" value={debt} />
        <Tile label="Kreditlimit" value={limit} />
        <Tile label="Genutzt" value={used} />
      </section>

      <section className="rounded-xl bg-surface p-3.5 sm:p-4 shadow-[var(--shadow-border)] flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted">Gesamtvermögen</p>
          <p className="mt-0.5 font-display text-2xl sm:text-3xl tracking-tight">
            <Money value={nw} />
          </p>
        </div>
        <div className="text-right text-[11px] text-muted space-y-0.5 tabular">
          <p>
            Jahresziel: <b className="text-fg">{money(yearThreshold(s.yearNetWorthBase))}</b>
          </p>
          <p>
            Passives Einkommen:{" "}
            <b className="text-gain">+{money(dailyRent + dailyDiv)} / Tag</b> (Miete{" "}
            {money(dailyRent)} · Div. {money(dailyDiv)})
          </p>
          <p>Lebenshaltung: {money(LIVING_PER_DAY)} / Tag</p>
        </div>
      </section>

      <details className="rounded-xl bg-surface px-3.5 py-2.5 text-xs text-muted shadow-[var(--shadow-border)]">
        <summary className="cursor-pointer font-medium text-fg select-none">
          Kredit- & Zinsregeln anzeigen (10 % p.a. · keine Autotilgung · Kunst erhöht Limit)
        </summary>
        <p className="mt-1.5 leading-relaxed">{HINTS.credit}</p>
      </details>

      {red || tight ? (
        <p className="text-xs sm:text-sm text-warn">
          {red ? "Mindestens eine Firma steht im Minus. " : null}
          {tight ? "Kreditlimit zu über 80 % genutzt." : null}
        </p>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-medium">Kredite</h2>
        {s.loans.filter((l) => l.remaining > 0.5).length === 0 ? (
          <p className="text-sm text-muted">Keine offenen Kredite. Tilgung nur manuell.</p>
        ) : (
          <ul className="space-y-3">
            {s.loans
              .filter((l) => l.remaining > 0.5)
              .map((loan) => {
                const company = s.companies.find((c) => c.id === loan.companyId);
                const title =
                  loan.owner === "player" ? "Privatschuld" : (company?.name ?? "Firmenkredit");
                return (
                  <li
                    key={loan.id}
                    className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-xs text-muted">
                          10 % p.a. · aufgelaufen {money(loan.accruedInterest, true)} · keine
                          Autotilgung
                        </p>
                      </div>
                      <p className="tabular text-sm">Rest {money(loan.remaining)}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Sondertilgung"
                        value={extra[loan.id] ?? ""}
                        onChange={(e) => setExtra({ ...extra, [loan.id]: e.target.value })}
                      />
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const n = Number(extra[loan.id]);
                          if (!n) return;
                          const err = s.extraPayment(loan.id, n);
                          if (err) toast.error(err);
                          else {
                            setExtra({ ...extra, [loan.id]: "" });
                            toast.success(`Sondertilgung über ${money(n)} verbucht.`);
                          }
                        }}
                      >
                        Tilgen
                      </Button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
        {personal > 0.5 ? (
          <p className="mt-2 text-xs text-warn">
            Übernommene Firmenschulden privat: {money(personal)}.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Transfer</h2>
        {s.companies.filter((c) => c.status === "active").length === 0 ? (
          <p className="text-sm text-muted">
            Lege zuerst ein Unternehmen an, um Kapital zu verschieben.
          </p>
        ) : (
          <ul className="space-y-3">
            {s.companies
              .filter((c) => c.status === "active")
              .map((c) => (
                <li key={c.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="tabular text-muted">Kasse {money(c.cash)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap sm:flex-nowrap gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Betrag"
                      className="w-full sm:flex-1"
                      value={xfer[c.id] ?? ""}
                      onChange={(e) => setXfer({ ...xfer, [c.id]: e.target.value })}
                    />
                    <Button
                      variant="secondary"
                      className="flex-1 sm:flex-initial"
                      onClick={() => {
                        const n = Number(xfer[c.id]);
                        if (!n) return;
                        const err = s.transfer(c.id, n);
                        if (err) toast.error(err);
                        else {
                          setXfer({ ...xfer, [c.id]: "" });
                          toast.success(`${money(n)} in ${c.name} eingelegt.`);
                        }
                      }}
                    >
                      Einlegen
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 sm:flex-initial"
                      onClick={() => {
                        const n = Number(xfer[c.id]);
                        if (!n) return;
                        const err = s.transfer(c.id, -n);
                        if (err) toast.error(err);
                        else {
                          setXfer({ ...xfer, [c.id]: "" });
                          toast.success(`${money(n)} aus ${c.name} entnommen.`);
                        }
                      }}
                    >
                      Abheben
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Buchungen</h2>
        <ul className="divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {s.ledger.slice(0, 14).map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted">{e.label}</span>
              <Delta value={e.amount} withLabel={false} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface p-2 sm:p-3 shadow-[var(--shadow-border)] min-w-0">
      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted truncate">
        {label}
      </p>
      <p className="mt-0.5 tabular text-xs sm:text-sm font-semibold truncate">
        <Money value={value} />
      </p>
    </div>
  );
}
