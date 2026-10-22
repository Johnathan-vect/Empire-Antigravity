import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/empire/AppShell";
import { useGame } from "@/game/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrate = useGame((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <AppShell />;
}
