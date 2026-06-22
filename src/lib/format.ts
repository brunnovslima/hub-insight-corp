export function formatBRL(value: number | null | undefined, opts?: { compact?: boolean }) {
  if (value == null || isNaN(value)) return "—";
  if (opts?.compact) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined) {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatMonth(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}