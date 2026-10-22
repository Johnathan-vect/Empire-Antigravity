import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "muted",
  title,
  children,
}: {
  className?: string;
  tone?: "muted" | "gain" | "loss" | "warn" | "accent";
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    muted: "text-muted bg-raised",
    gain: "text-gain bg-raised",
    loss: "text-loss bg-raised",
    warn: "text-warn bg-raised",
    accent: "text-accent bg-accent/15",
  };
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
