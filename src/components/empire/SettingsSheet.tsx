import { X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { HINTS } from "@/game/catalog";
import { useGame } from "@/game/store";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/game/types";

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: "dark", label: "Dunkel" },
  { id: "light", label: "Hell" },
  { id: "system", label: "System" },
];

export function SettingsSheet() {
  const open = useGame((s) => s.ui.showSettings);
  const close = useGame((s) => s.openSettings);
  const theme = useGame((s) => s.theme);
  const setTheme = useGame((s) => s.setTheme);
  const name = useGame((s) => s.playerName);
  const setName = useGame((s) => s.setName);
  const career = useGame((s) => s.career);
  const restart = useGame((s) => s.restart);
  const [confirmReset, setConfirmReset] = useState(false);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end empire-scrim">
      <div className="flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-display text-2xl tracking-tight">Einstellungen</h2>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-md hover:bg-raised"
            onClick={() => {
              setConfirmReset(false);
              close(false);
            }}
            aria-label="Schließen"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-10">
          <label className="block">
            <span className="text-xs text-muted">Name</span>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <div>
            <p className="text-xs text-muted">Erscheinungsbild</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "h-11 rounded-md text-sm",
                    theme === t.id ? "bg-accent text-accent-fg" : "bg-raised text-muted",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Zeit</p>
            <p className="mt-1 text-sm text-muted">
              1×: acht echte Minuten sind ein Spieltag. Pause hält Uhr, Börse und Kosten an. 2× und
              5× beschleunigen. Leertaste schaltet Pause. Ein Jahr hat 360 Tage.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Karrierekarte</p>
            <p className="mt-1 text-sm text-muted">
              Stufe {career.level} · Läufe {career.runs}
            </p>
            <p className="text-sm text-muted">Verdient {money(career.totalEarned)}</p>
            <p className="text-sm text-muted">Ausgegeben {money(career.totalSpent)}</p>
            <p className="text-sm text-muted">Gründungen {career.companiesFounded}</p>
            <p className="text-sm text-muted">Bestes Vermögen {money(career.bestNetWorth)}</p>
          </div>

          <p className="text-xs text-faint">{HINTS.year}</p>

          {confirmReset ? (
            <div className="space-y-2 rounded-lg bg-raised p-3">
              <p className="text-xs text-muted">
                Aktuellen Spielstand verwerfen und neu starten? Die Karrierekarte bleibt erhalten.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    restart();
                    setConfirmReset(false);
                    close(false);
                    toast.success("Neuer Spielstand gestartet.");
                  }}
                >
                  Wirklich zurücksetzen
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Neuer Spielstand
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
