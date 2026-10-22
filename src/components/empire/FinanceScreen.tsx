import { CREDIT_OFFERS, HINTS, LIVING_PER_DAY, POSSESSIONS, yearThreshold } from "@/game/catalog";
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
import type { LoanOwner } from "@/game/types";
import { money } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Delta, Money } from "./Delta";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Landmark,
  Lock,
  Plus,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const activeCompanies = s.companies.filter((c) => c.status === "active");

  const [extra, setExtra] = useState<Record<string, string>>({});
  const [xfer, setXfer] = useState<Record<string, string>>({});

  // Kreditaufnahme State
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<"micro" | "classic" | "invest">("micro");
  const [borrowAmount, setBorrowAmount] = useState<number>(2000);
  const [borrowTarget, setBorrowTarget] = useState<"player" | string>("player");

  const selectedOffer = CREDIT_OFFERS.find((o) => o.id === selectedOfferId) ?? CREDIT_OFFERS[0];
  const maxBorrowPossible = Math.max(0, Math.min(selectedOffer.maxAmount, avail));
  const effectiveBorrowAmount = Math.max(500, Math.min(maxBorrowPossible, borrowAmount));
  const dailyInterestCost = (effectiveBorrowAmount * selectedOffer.annualRate) / 360;
  const yearlyInterestCost = effectiveBorrowAmount * selectedOffer.annualRate;

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Finanzen</h1>
          <p className="text-xs text-muted mt-0.5">
            Kapitalstruktur, Verbindlichkeiten & Bonitätsrahmen
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setBorrowOpen(!borrowOpen)}
            className="gap-1.5 text-xs shadow-sm cursor-pointer"
          >
            <CreditCard className="size-3.5" />
            <span>Kredit aufnehmen</span>
          </Button>
        </div>
      </header>

      {/* Kreditaufnahme Modul / Card */}
      {borrowOpen ? (
        <section className="rounded-xl bg-surface p-4 sm:p-5 shadow-[var(--shadow-border)] border border-accent/30 space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="size-4 text-accent" />
              <h2 className="font-medium text-sm sm:text-base text-fg">
                Bankdarlehen & Betriebsmittelkredite
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setBorrowOpen(false)}
              className="text-muted hover:text-fg text-xs cursor-pointer p-1 rounded-md"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="text-xs text-muted">
            Wähle eine zu deiner Bonität und deinem Zweck passende Kreditlinie. Die Zinsen fallen
            täglich an und können jederzeit ohne Vorfälligkeitsentschädigung sondertilgt werden.
          </p>

          {/* 3 Kredit-Optionen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CREDIT_OFFERS.map((offer) => {
              const reqRepMet = s.reputation >= offer.minReputation;
              const reqNetMet = !offer.minNetWorth || nw >= offer.minNetWorth;
              const isUnlocked = reqRepMet && reqNetMet;
              const isSelected = selectedOfferId === offer.id;

              return (
                <div
                  key={offer.id}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedOfferId(offer.id);
                      setBorrowAmount(Math.min(offer.maxAmount, Math.max(500, borrowAmount)));
                    }
                  }}
                  className={cn(
                    "rounded-lg p-3 border transition-all text-left relative flex flex-col justify-between",
                    !isUnlocked
                      ? "opacity-55 bg-raised/50 border-border cursor-not-allowed"
                      : isSelected
                        ? "bg-raised border-accent shadow-sm cursor-pointer ring-1 ring-accent"
                        : "bg-surface hover:bg-raised border-border cursor-pointer",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-fg leading-tight">
                        {offer.name}
                      </span>
                      {isUnlocked ? (
                        <Badge tone={isSelected ? "accent" : "muted"} className="text-[10px] py-0">
                          {(offer.annualRate * 100).toFixed(1)} % p.a.
                        </Badge>
                      ) : (
                        <Lock className="size-3 text-muted shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted line-clamp-2 mt-0.5">{offer.subtitle}</p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                    <span className="text-muted">Max: {money(offer.maxAmount)}</span>
                    <span
                      className={cn(
                        "font-medium",
                        isUnlocked ? "text-gain" : "text-loss",
                      )}
                    >
                      {offer.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Betrag & Auszahlungsziel */}
          {avail <= 0 ? (
            <p className="text-xs text-loss bg-loss/10 p-2.5 rounded-lg border border-loss/20">
              Dein Kreditrahmen ({money(limit)}) ist aktuell vollständig ausgeschöpft. Tilge
              bestehende Kredite oder steigere dein Ansehen/Besitz, um das Limit zu erhöhen.
            </p>
          ) : (
            <div className="space-y-3.5 pt-2 border-t border-[var(--border-subtle)]">
              {/* Slider & Betragswahl */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted">Kreditbetrag festlegen:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      ["1.000 €", 1000],
                      ["3.000 €", 3000],
                      ["5.000 €", 5000],
                      ["Max", maxBorrowPossible],
                    ].map(([lbl, val]) => (
                      <button
                        key={String(lbl)}
                        type="button"
                        onClick={() => setBorrowAmount(Math.min(maxBorrowPossible, Number(val)))}
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer",
                          effectiveBorrowAmount === val
                            ? "bg-accent text-accent-fg border-accent"
                            : "bg-surface text-muted border-border hover:text-fg",
                        )}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <Input
                      type="number"
                      min={500}
                      max={maxBorrowPossible}
                      step={250}
                      value={effectiveBorrowAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!Number.isNaN(val)) {
                          setBorrowAmount(Math.min(maxBorrowPossible, Math.max(500, val)));
                        }
                      }}
                      className="tabular font-semibold text-center h-9"
                    />
                  </div>

                  <div className="flex-1">
                    <Slider
                      min={500}
                      max={Math.max(500, maxBorrowPossible)}
                      step={250}
                      value={[effectiveBorrowAmount]}
                      onValueChange={(vals) => setBorrowAmount(vals[0] ?? 500)}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-muted mt-1 tabular">
                  <span>Min: 500 €</span>
                  <span>Freies Limit: {money(avail)}</span>
                </div>
              </div>

              {/* Auszahlungs-Ziel (Privatkonto vs. Firma) */}
              <div>
                <span className="text-xs text-muted block mb-1.5">Auszahlungsgutschrift an:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBorrowTarget("player")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors",
                      borrowTarget === "player"
                        ? "bg-accent text-accent-fg border-accent"
                        : "bg-surface text-muted border-border hover:text-fg",
                    )}
                  >
                    <Wallet className="size-3.5" />
                    <span>Privatkonto (Privatschuld)</span>
                  </button>

                  {activeCompanies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setBorrowTarget(c.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors",
                        borrowTarget === c.id
                          ? "bg-accent text-accent-fg border-accent"
                          : "bg-surface text-muted border-border hover:text-fg",
                      )}
                    >
                      <Building2 className="size-3.5" />
                      <span>{c.name} (Firmenkredit)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Zinskalkulator & Konditionen-Vorschau */}
              <div className="grid grid-cols-3 gap-2 bg-raised/70 rounded-lg p-2.5 text-xs border border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] uppercase text-muted block">Zinssatz</span>
                  <span className="tabular font-semibold text-fg mt-0.5 block">
                    {(selectedOffer.annualRate * 100).toFixed(1)} % p.a.
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted block">Tägliche Zinsen</span>
                  <span className="tabular font-semibold text-loss mt-0.5 block">
                    ~{money(dailyInterestCost, true)} / Tag
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-muted block">Jahreszinslast</span>
                  <span className="tabular font-semibold text-fg mt-0.5 block">
                    {money(yearlyInterestCost)}
                  </span>
                </div>
              </div>

              {/* Verbindlicher Abschluss-Button */}
              <Button
                className="w-full py-2.5 text-xs sm:text-sm font-medium"
                disabled={effectiveBorrowAmount <= 0 || effectiveBorrowAmount > avail}
                onClick={() => {
                  const isComp = borrowTarget !== "player";
                  const err = s.borrowLoan(
                    selectedOffer.id,
                    effectiveBorrowAmount,
                    isComp ? "company" : "player",
                    isComp ? borrowTarget : undefined,
                  );
                  if (err) {
                    toast.error(err);
                  } else {
                    const targetLabel = isComp
                      ? (activeCompanies.find((c) => c.id === borrowTarget)?.name ?? "Firma")
                      : "Privatkonto";
                    toast.success(
                      `Kredit über ${money(effectiveBorrowAmount)} erfolgreich auf ${targetLabel} ausgezahlt.`,
                    );
                    setBorrowOpen(false);
                  }
                }}
              >
                {money(effectiveBorrowAmount)} jetzt verbindlich aufnehmen
              </Button>
            </div>
          )}
        </section>
      ) : null}

      <section className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <Tile label="Privatkonto" value={s.cash} />
        <Tile label="Firmenkassen" value={bound} />
        <Tile label="Aktiendepot" value={depot} />
        <Tile label="Krypto-Wallet" value={crypto} />
        <Tile label="Immobilien" value={realEstate} />
        <Tile label="Besitz & Kunst" value={collections} />
        <Tile label="Schulden" value={debt} />
        <Tile label="Kreditlimit" value={limit} />
        <Tile label="Frei" value={avail} />
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
          Kredit- & Zinsregeln anzeigen (Transparente Konditionen · Kunst erhöht Limit)
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Bestehende Kredite & Verbindlichkeiten</h2>
          <span className="text-[11px] text-muted tabular">
            Gesamtschuld: <b className="text-fg">{money(debt)}</b>
          </span>
        </div>

        {s.loans.filter((l) => l.remaining > 0.5).length === 0 ? (
          <p className="text-sm text-muted rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            Keine offenen Kredite vorhanden. Dein Unternehmen wirtschaftet schuldenfrei.
          </p>
        ) : (
          <ul className="space-y-3">
            {s.loans
              .filter((l) => l.remaining > 0.5)
              .map((loan) => {
                const company = s.companies.find((c) => c.id === loan.companyId);
                const isCompany = loan.owner === "company";
                const title = isCompany ? (company?.name ?? "Firmenkredit") : "Privatschuld";
                const ratePct = (loan.annualRate * 100).toFixed(1);

                return (
                  <li
                    key={loan.id}
                    className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-fg">{title}</p>
                          {loan.label ? (
                            <Badge tone="accent" className="text-[10px] py-0">
                              {loan.label}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted mt-0.5 tabular">
                          {ratePct} % p.a. · Aufgelaufene Zinsen:{" "}
                          <span className="text-loss">{money(loan.accruedInterest, true)}</span> ·
                          Tilgung: {isCompany ? "Firmenkasse" : "Privatkonto"}
                        </p>
                      </div>
                      <p className="tabular font-display font-semibold text-sm text-fg">
                        Rest {money(loan.remaining)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder={`Sondertilgung (${isCompany ? "aus " + (company?.name ?? "Firma") : "privat"})`}
                        value={extra[loan.id] ?? ""}
                        onChange={(e) => setExtra({ ...extra, [loan.id]: e.target.value })}
                        className="text-xs"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const n = Number(extra[loan.id]);
                          if (!n) return;
                          const err = s.extraPayment(loan.id, n);
                          if (err) toast.error(err);
                          else {
                            setExtra({ ...extra, [loan.id]: "" });
                            toast.success(`Sondertilgung über ${money(n)} erfolgreich verbucht.`);
                          }
                        }}
                      >
                        Tilgen
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const err = s.extraPayment(loan.id, loan.remaining);
                          if (err) toast.error(err);
                          else {
                            setExtra({ ...extra, [loan.id]: "" });
                            toast.success(`Kredit vollständig getilgt!`);
                          }
                        }}
                      >
                        Volltilgung
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

      {/* Gesellschafter-Transfers (Privat <-> Betrieb) */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-medium">Kapitalübertrag (Privatkonto ⇄ Unternehmenskasse)</h2>
            <p className="text-[11px] text-muted">
              Rechtlich saubere Einlagen und Privatentnahmen zwischen Inhaber und Betrieb
            </p>
          </div>
        </div>

        {activeCompanies.length === 0 ? (
          <p className="text-sm text-muted rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            Gründe zuerst einen Betrieb, um Betriebskapital einzulegen oder Gewinne zu entnehmen.
          </p>
        ) : (
          <ul className="space-y-3">
            {activeCompanies.map((c) => (
              <li key={c.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-fg">{c.name}</span>
                  <span className="tabular text-muted text-xs">
                    Firmenkasse: <b className="text-fg">{money(c.cash)}</b>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap sm:flex-nowrap gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Betrag in €"
                    className="w-full sm:flex-1 text-xs"
                    value={xfer[c.id] ?? ""}
                    onChange={(e) => setXfer({ ...xfer, [c.id]: e.target.value })}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    onClick={() => {
                      const n = Number(xfer[c.id]);
                      if (!n) return;
                      const err = s.transfer(c.id, n);
                      if (err) toast.error(err);
                      else {
                        setXfer({ ...xfer, [c.id]: "" });
                        toast.success(`${money(n)} als Einlage in ${c.name} übertragen.`);
                      }
                    }}
                  >
                    Einlegen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    onClick={() => {
                      const n = Number(xfer[c.id]);
                      if (!n) return;
                      const err = s.transfer(c.id, -n);
                      if (err) toast.error(err);
                      else {
                        setXfer({ ...xfer, [c.id]: "" });
                        toast.success(`${money(n)} als Privatentnahme aus ${c.name} entnommen.`);
                      }
                    }}
                  >
                    Entnehmen
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Buchungsjournal</h2>
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
