import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Building2, Check, Layers, Lock, MapPin, Sparkles } from "lucide-react";
import {
  COMPANY_SCALES,
  HINTS,
  INDUSTRIES,
  INTEREST_ANNUAL,
  LOCATIONS,
  companyScaleById,
  industryById,
  locationById,
  productsForIndustry,
} from "@/game/catalog";
import { getIndustryDemandInfo, getProductDemandInfo } from "@/game/sim";
import { availableCredit, netWorth, useGame } from "@/game/store";
import { money, num1 } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { BackBar } from "./chrome";
import { DemandBadge } from "./MarketAnalysis";
import type { CompanyScaleId, Industry, LocationId } from "@/game/types";
import { cn } from "@/lib/utils";

const DEFAULT_NAMES: Record<Industry, string> = {
  imbiss: "Kiez-Imbiss am Eck",
  cafe: "Café & Bistro Aurora",
  shop: "Trend & Lifestyle Store",
};

export function FoundingFlow() {
  const s = useGame();
  const currentNetWorth = netWorth(s);
  const availCredit = availableCredit(s);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>("imbiss");
  const [selectedLocation, setSelectedLocation] = useState<LocationId>("kiez");
  const [selectedScale, setSelectedScale] = useState<CompanyScaleId>("local");
  const [name, setName] = useState(DEFAULT_NAMES.imbiss);
  const [extra, setExtra] = useState(500);
  const [err, setErr] = useState<string | null>(null);

  const indDef = industryById(selectedIndustry);
  const locDef = locationById(selectedLocation);
  const scaleDef = companyScaleById(selectedScale);
  const fee = Math.round(indDef.foundingFee * scaleDef.feeMult);
  const isLicensed = s.licenses.includes(selectedIndustry);
  const isUnlocked = currentNetWorth >= indDef.minNetWorth;
  const isScaleUnlocked = currentNetWorth >= scaleDef.minNetWorth;

  const maxEquity = Math.min(s.cash, fee);
  const minEquity = Math.max(0, fee - availCredit);
  const [equity, setEquity] = useState(() => Math.min(maxEquity, Math.max(minEquity, 0)));

  const safeEquity = Math.min(maxEquity, Math.max(minEquity, equity));
  const loan = Math.max(0, fee - safeEquity);
  const extraAmt = Math.max(0, extra);
  const remainCash = s.cash - safeEquity - extraAmt;
  const dailyRent = Math.round(locDef.rentMult * indDef.baseRent * scaleDef.rentMult);
  const nameOk = name.trim().length >= 3 && name.trim().length <= 32;
  const unaffordable =
    !isLicensed || !isScaleUnlocked || maxEquity + 0.01 < minEquity || remainCash < -0.01;

  const handleSelectIndustry = (indId: Industry) => {
    setSelectedIndustry(indId);
    setName(DEFAULT_NAMES[indId]);
    const nextInd = industryById(indId);
    const nextFee = Math.round(nextInd.foundingFee * scaleDef.feeMult);
    const nextMax = Math.min(s.cash, nextFee);
    const nextMin = Math.max(0, nextFee - availCredit);
    setEquity(Math.min(nextMax, Math.max(nextMin, Math.round(nextFee * 0.5))));
    setErr(null);
  };

  const handleSelectScale = (scaleId: CompanyScaleId) => {
    setSelectedScale(scaleId);
    const nextScale = companyScaleById(scaleId);
    const nextFee = Math.round(indDef.foundingFee * nextScale.feeMult);
    const nextMax = Math.min(s.cash, nextFee);
    const nextMin = Math.max(0, nextFee - availCredit);
    setEquity(Math.min(nextMax, Math.max(nextMin, Math.round(nextFee * 0.5))));
    setErr(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackBar
        title="Unternehmen gründen"
        onBack={() => {
          if (step > 1) {
            setStep((step - 1) as 1 | 2);
          } else {
            s.openFounding(false);
          }
        }}
      />

      {/* Step Indicator */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-raised p-1.5 text-xs">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-colors",
            step === 1 ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          <Building2 className="size-3.5" />
          <span>1. Branche</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (isUnlocked) setStep(2);
          }}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-colors",
            step === 2 ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          <MapPin className="size-3.5" />
          <span>2. Standort & Größe</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (isUnlocked && isLicensed && isScaleUnlocked) setStep(3);
          }}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-colors",
            step === 3 ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          <Sparkles className="size-3.5" />
          <span>3. Finanzierung</span>
        </button>
      </div>

      {/* STEP 1: Branche wählen */}
      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-lg tracking-tight">Schritt 1: Branche wählen</h2>
            <p className="mt-0.5 text-xs text-muted">
              Wähle deine Zielbranche. Höhere Branchen bieten größere Margen und mehr Volumen,
              erfordern aber Vermögen und eine teurere Lizenz.
            </p>
          </div>

          <div className="space-y-3">
            {INDUSTRIES.map((ind) => {
              const owned = s.licenses.includes(ind.id);
              const unlocked = currentNetWorth >= ind.minNetWorth;
              const selected = selectedIndustry === ind.id;
              const indDemand = getIndustryDemandInfo(s, ind.id);
              const sampleProducts = productsForIndustry(ind.id)
                .slice()
                .sort(
                  (a, b) =>
                    getProductDemandInfo(s, b.id).pct - getProductDemandInfo(s, a.id).pct,
                );

              return (
                <div
                  key={ind.id}
                  onClick={() => {
                    if (unlocked) handleSelectIndustry(ind.id);
                  }}
                  className={cn(
                    "relative rounded-xl p-4 transition-all duration-150 cursor-pointer shadow-[var(--shadow-border)]",
                    selected ? "bg-surface ring-2 ring-accent" : "bg-surface hover:bg-raised/70",
                    !unlocked && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-base">{ind.name}</h3>
                        <DemandBadge info={indDemand} prefix="Nachfrage:" showDelta />
                        <Badge tone={indDemand.competitionTone} className="tabular">
                          Konkurrenz: {indDemand.competitionPct} % · {indDemand.competitionLabel}
                        </Badge>
                        {owned ? (
                          <Badge tone="gain" className="gap-1">
                            <Check className="size-3" /> Lizenz aktiv
                          </Badge>
                        ) : unlocked ? (
                          <Badge>Lizenz: {money(ind.licenseFee)}</Badge>
                        ) : (
                          <Badge tone="warn" className="gap-1">
                            <Lock className="size-3" /> Ab {money(ind.minNetWorth)}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted leading-relaxed">{ind.blurb}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-xs">
                    <div className="rounded-lg bg-raised p-1.5 sm:p-2 min-w-0">
                      <span className="text-[9px] sm:text-[10px] text-muted block truncate">Gebühr</span>
                      <span className="font-semibold tabular text-[11px] sm:text-xs block truncate">
                        {money(ind.foundingFee)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-raised p-1.5 sm:p-2 min-w-0">
                      <span className="text-[9px] sm:text-[10px] text-muted block truncate">Miete</span>
                      <span className="font-semibold tabular text-[11px] sm:text-xs block truncate">
                        {ind.baseRent === 0 ? "0 €" : `${money(ind.baseRent)}/T`}
                      </span>
                    </div>
                    <div className="rounded-lg bg-raised p-1.5 sm:p-2 min-w-0">
                      <span className="text-[9px] sm:text-[10px] text-muted block truncate">Ø Bon</span>
                      <span className="font-semibold tabular text-[11px] sm:text-xs block truncate">
                        {ind.avgTicket}
                      </span>
                    </div>
                    <div className="rounded-lg bg-raised p-1.5 sm:p-2 min-w-0">
                      <span className="text-[9px] sm:text-[10px] text-muted block truncate">Ø Umsatz</span>
                      <span className="font-semibold tabular text-[11px] sm:text-xs text-gain block truncate">
                        {ind.estDailyRevenue}
                      </span>
                    </div>
                  </div>

                  {/* Sample Products with live demand */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                    <span className="text-[10px] uppercase tracking-wider text-muted mr-1">
                      Produkte & Nachfrage:
                    </span>
                    {sampleProducts.map((p) => {
                      const pInfo = getProductDemandInfo(s, p.id);
                      return (
                        <span
                          key={p.id}
                          className="rounded bg-raised px-2 py-0.5 text-fg tabular flex items-center gap-1 border border-[var(--border-subtle)]"
                        >
                          <span>{p.name}</span>
                          <span
                            className={cn(
                              "font-semibold",
                              pInfo.tone === "gain"
                                ? "text-gain"
                                : pInfo.tone === "warn"
                                  ? "text-warn"
                                  : pInfo.tone === "loss"
                                    ? "text-loss"
                                    : "text-muted",
                            )}
                          >
                            {pInfo.pct} % {pInfo.arrow}
                          </span>
                        </span>
                      );
                    })}
                  </div>

                  {/* License buy button if not owned */}
                  {!owned && unlocked && selected ? (
                    <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <span className="text-xs text-muted">
                        Einmalige Lizenzgebühr: <b className="text-fg">{money(ind.licenseFee)}</b>
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const res = s.buyIndustryLicense(ind.id);
                          if (res) toast.error(res);
                          else toast.success(`Lizenz für ${ind.name} erfolgreich erworben!`);
                        }}
                      >
                        Lizenz erwerben · {money(ind.licenseFee)}
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              className="gap-2"
              disabled={!isUnlocked}
              onClick={() => {
                if (!isLicensed) {
                  const res = s.buyIndustryLicense(selectedIndustry);
                  if (res) {
                    toast.error(res);
                    return;
                  }
                  toast.success(`Lizenz für ${indDef.name} erworben!`);
                }
                setStep(2);
              }}
            >
              <span>Weiter zu Standort & Größe</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* STEP 2: Standort & Betriebsgröße wählen */}
      {step === 2 ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <div>
              <h2 className="font-display text-lg tracking-tight flex items-center gap-2">
                <Layers className="size-4 text-accent" />
                <span>Betriebsgröße (Expansionsstufe)</span>
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Gründe als einzelnes lokales Geschäft oder starte direkt als Ladenkette mit höherem
                Kundendurchsatz.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {COMPANY_SCALES.map((sc) => {
                const selected = selectedScale === sc.id;
                const unlocked = currentNetWorth >= sc.minNetWorth;
                const scFee = Math.round(indDef.foundingFee * sc.feeMult);

                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      if (unlocked) handleSelectScale(sc.id);
                    }}
                    className={cn(
                      "rounded-xl p-3.5 transition-all duration-150 cursor-pointer shadow-[var(--shadow-border)] flex flex-col justify-between gap-2",
                      selected ? "bg-surface ring-2 ring-accent" : "bg-surface hover:bg-raised/70",
                      !unlocked && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                          {sc.id === "local"
                            ? "Einzelbetrieb"
                            : sc.id === "smallChain"
                              ? "3 Filialen"
                              : "Regionale Kette"}
                        </span>
                        {selected ? (
                          <Badge tone="gain" className="px-1.5 py-0 text-[10px]">
                            Gewählt
                          </Badge>
                        ) : !unlocked ? (
                          <Badge tone="warn" className="px-1.5 py-0 text-[10px] gap-0.5">
                            <Lock className="size-2.5" /> {money(sc.minNetWorth)}
                          </Badge>
                        ) : null}
                      </div>
                      <h3 className="mt-1 font-medium text-sm">{sc.name}</h3>
                      <p className="mt-1 text-[11px] text-muted leading-snug">{sc.blurb}</p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] tabular">
                      <span className="text-muted">Gebühr: <b className="text-fg">{money(scFee)}</b></span>
                      <span className="font-semibold text-gain">Volumen {num1(sc.volumeMult)}×</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="font-display text-lg tracking-tight flex items-center gap-2">
                <MapPin className="size-4 text-accent" />
                <span>Standort wählen</span>
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Der Standort bestimmt Kundenfrequenz und tägliche Fixmiete für deinen Betrieb (
                {indDef.name} · {scaleDef.name}).
              </p>
            </div>

            <div className="space-y-2.5">
              {LOCATIONS.map((loc) => {
                const selected = selectedLocation === loc.id;
                const rent = Math.round(loc.rentMult * indDef.baseRent * scaleDef.rentMult);
                const hasSynergy = loc.synergyIndustry === selectedIndustry;
                const isGeneralSynergy = !loc.synergyIndustry && Boolean(loc.synergyBonus);
                const synergyActive = hasSynergy || isGeneralSynergy;
                const synergyMult = synergyActive ? (loc.synergyBonus ?? 1) : 1;
                const totalFreq = loc.freqMult * scaleDef.volumeMult * synergyMult;

                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc.id)}
                    className={cn(
                      "rounded-xl p-4 transition-all duration-150 cursor-pointer shadow-[var(--shadow-border)]",
                      selected ? "bg-surface ring-2 ring-accent" : "bg-surface hover:bg-raised/70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-base">{loc.name}</h3>
                          {selected ? (
                            <Badge tone="gain" className="gap-1">
                              <Check className="size-3" /> Gewählt
                            </Badge>
                          ) : null}
                          {hasSynergy ? (
                            <Badge tone="accent" className="gap-1 text-[10px]">
                              <Sparkles className="size-2.5" />
                              <span>{loc.synergyLabel}</span>
                            </Badge>
                          ) : isGeneralSynergy ? (
                            <Badge tone="accent" className="gap-1 text-[10px]">
                              <Sparkles className="size-2.5" />
                              <span>{loc.synergyLabel}</span>
                            </Badge>
                          ) : loc.synergyIndustry ? (
                            <Badge tone="muted" className="text-[10px]">
                              Synergie mit {industryById(loc.synergyIndustry).name} ({loc.synergyLabel})
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{loc.blurb}</p>
                      </div>
                      <div className="text-right whitespace-nowrap shrink-0">
                        <p className="font-medium tabular text-sm">
                          {rent === 0 ? "0 € / Tag" : `${money(rent)} / Tag`}
                        </p>
                        <p className="text-[11px] text-gain tabular">
                          Frequenz {num1(totalFreq)}× gesamt
                          {synergyActive && loc.synergyBonus ? (
                            <span className="block text-[10px] text-accent">
                              (+{Math.round(((loc.synergyBonus ?? 1) - 1) * 100)} % Synergie)
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" className="gap-1.5" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" />
              <span>Zurück</span>
            </Button>
            <Button
              className="gap-2"
              disabled={!isScaleUnlocked}
              onClick={() => setStep(3)}
            >
              <span>Weiter zur Finanzierung</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* STEP 3: Finanzierung & Gründung */}
      {step === 3 ? (
        <div className="space-y-5 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge>{indDef.name}</Badge>
              <Badge tone="accent">{scaleDef.name}</Badge>
              <Badge>{locDef.name}</Badge>
              <Badge tone="gain">{money(dailyRent)} Miete/Tag</Badge>
              <DemandBadge
                info={getIndustryDemandInfo(s, selectedIndustry)}
                prefix="Branchen-Nachfrage:"
              />
            </div>
            <h2 className="font-display text-lg tracking-tight">Finanzierung & Gründung</h2>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted">Name des Betriebs</span>
            <Input
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              placeholder="Betriebsname..."
            />
          </label>

          <div>
            <div className="flex items-center justify-between text-sm">
              <span>Eigenkapital der Gründungsgebühr</span>
              <span className="tabular font-medium">{money(safeEquity)}</span>
            </div>
            <Slider
              className="mt-2"
              min={Math.round(Math.min(minEquity, maxEquity))}
              max={Math.round(Math.max(minEquity, maxEquity, 1))}
              step={50}
              value={[safeEquity]}
              onValueChange={(v) => setEquity(v[0] ?? safeEquity)}
              disabled={!isLicensed || (unaffordable && maxEquity <= 0)}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
              <span>Min: {money(minEquity)}</span>
              <span>Kreditanteil: {money(loan)}</span>
              <span>Max: {money(maxEquity)}</span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Die {money(fee)} Gründungsgebühr ({scaleDef.name}) ist versunken. Der Kreditanteil (
              {money(loan)}) wird als Firmenschuld verbucht.
            </p>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted">
              Optionale Einlage in die Firmenkasse
            </span>
            <Input
              className="mt-1"
              type="number"
              min={0}
              step={50}
              value={extra || ""}
              placeholder="0"
              onChange={(e) => setExtra(Math.max(0, Number(e.target.value) || 0))}
            />
            <span className="text-[11px] text-muted mt-1 block">
              Guthaben für den ersten Wareneinkauf in der Firmenkasse.
            </span>
          </label>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <Row k="Privat vorher" v={money(s.cash)} />
            <Row k="Privat nachher" v={money(remainCash)} />
            <Row k="Kasse Start" v={money(extraAmt)} />
            <Row k="Firmenschuld" v={money(loan)} />
            <Row k="Zins p.a." v={`${num1(INTEREST_ANNUAL * 100)} %`} />
            <Row k="Miete / Tag" v={money(dailyRent)} />
            <Row k="Kredit frei" v={money(availCredit - loan)} />
            <Row k="Größenstufe" v={`${scaleDef.name} (${num1(scaleDef.volumeMult)}×)`} />
          </dl>

          <details className="rounded-lg bg-raised px-3 py-2 text-xs text-muted">
            <summary className="cursor-pointer font-medium text-fg select-none">
              Hinweise zu Gründung & Kredit (ausklappen)
            </summary>
            <p className="mt-1.5 leading-relaxed">
              {HINTS.founding} {HINTS.credit}
            </p>
          </details>

          {err ? <p className="text-sm text-loss font-medium">{err}</p> : null}

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" className="gap-1.5" onClick={() => setStep(2)}>
              <ArrowLeft className="size-4" />
              <span>Zurück</span>
            </Button>
            <Button
              disabled={
                !isLicensed ||
                !isScaleUnlocked ||
                !nameOk ||
                remainCash < -0.01 ||
                maxEquity + 0.01 < minEquity
              }
              onClick={() => {
                const msg = s.foundCompany(
                  name,
                  selectedIndustry,
                  selectedLocation,
                  safeEquity,
                  extraAmt,
                  selectedScale,
                );
                setErr(msg);
                if (msg) toast.error(msg);
                else
                  toast.success(
                    `${name.trim()} (${indDef.name} · ${scaleDef.name}) erfolgreich gegründet!`,
                  );
              }}
            >
              Betrieb jetzt gründen
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-raised px-3 py-2">
      <dt className="text-[11px] text-muted">{k}</dt>
      <dd className="tabular font-medium text-fg">{v}</dd>
    </div>
  );
}
