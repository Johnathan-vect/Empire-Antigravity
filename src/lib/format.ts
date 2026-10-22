const eur0 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eur2 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numDe = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const numDe1 = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const numDe2 = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(n: number, cents = false): string {
  return (cents ? eur2 : eur0).format(n);
}

export function signedMoney(n: number, cents = false): string {
  const formatted = money(Math.abs(n), cents);
  if (n > 0.004) return `+${formatted}`;
  if (n < -0.004) return `−${formatted}`;
  return formatted;
}

export function num(n: number): string {
  return numDe.format(n);
}

export function num1(n: number): string {
  return numDe1.format(n);
}

export function num2(n: number): string {
  return numDe2.format(n);
}

export function pct(n: number): string {
  const v = n * 100;
  const body = `${numDe1.format(Math.abs(v))} %`;
  if (v > 0.05) return `+${body}`;
  if (v < -0.05) return `−${body}`;
  return body;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function clockLabel(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}
