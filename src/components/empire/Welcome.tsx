import { useState } from "react";
import { createPortal } from "react-dom";
import { START_CASH } from "@/game/catalog";
import { useGame } from "@/game/store";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Welcome() {
  const seen = useGame((s) => s.seenWelcome);
  const dismiss = useGame((s) => s.dismissWelcome);
  const setName = useGame((s) => s.setName);
  const [name, setLocal] = useState("");
  if (seen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <p className="font-display text-4xl tracking-tight">Empire</p>
        <p className="mt-3 text-sm text-muted">
          Du startest als Privatperson mit {money(START_CASH)}. Kein vorgeschriebener Weg —
          Unternehmen, Börse oder beides.
        </p>
        <p className="mt-2 text-sm text-muted">
          Firmenpleite beendet den Stand nicht. Run-Ende erst privat an der Jahreskante. Gewinne und
          Verluste mit Vorzeichen, Pfeil und Text.
        </p>
        <p className="mt-2 text-sm text-muted">
          Acht echte Minuten sind ein Spieltag. Pause oder Leertaste hält Zeit und Kosten. Tempo 1×
          / 2× / 5×.
        </p>
        <label className="mt-5 block">
          <span className="text-xs uppercase tracking-wider text-muted">Name (optional)</span>
          <Input
            className="mt-1"
            value={name}
            maxLength={24}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Spieler"
          />
        </label>
        <Button
          className="mt-5 w-full"
          onClick={() => {
            if (name.trim()) setName(name.trim());
            dismiss();
          }}
        >
          Loslegen
        </Button>
      </div>
    </div>,
    document.body,
  );
}
