import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { money, signedMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Delta({
  value,
  cents = false,
  withLabel = true,
  className,
}: {
  value: number;
  cents?: boolean;
  withLabel?: boolean;
  className?: string;
}) {
  const pos = value > 0.004;
  const neg = value < -0.004;
  const Icon = pos ? ArrowUpRight : neg ? ArrowDownRight : Minus;
  const label = pos ? "Gewinn" : neg ? "Verlust" : "Unverändert";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular text-sm",
        pos ? "text-gain" : neg ? "text-loss" : "text-muted",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      <span>{signedMoney(value, cents)}</span>
      {withLabel ? <span className="font-normal text-muted"> {label}</span> : null}
    </span>
  );
}

export function Money({
  value,
  cents = false,
  className,
}: {
  value: number;
  cents?: boolean;
  className?: string;
}) {
  return <span className={cn("tabular", className)}>{money(value, cents)}</span>;
}
