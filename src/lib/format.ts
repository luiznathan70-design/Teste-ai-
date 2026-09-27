import { TIMEZONE } from "./constants";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata centavos como moeda: 4990 -> "R$ 49,90" */
export function formatMoney(cents: number) {
  return brl.format(cents / 100);
}

/** Converte "49,90" / "49.90" / "49" em centavos. Retorna NaN se inválido. */
export function parseMoney(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return NaN;
  if (typeof value === "number") return Math.round(value * 100);
  const clean = value.replace(/[R$\s]/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

/** Centavos para valor de input: 4990 -> "49,90" */
export function centsToInput(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" }).format(
    new Date(date),
  );
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, dateStyle: "long" }).format(new Date(date));
}

/** (11) 99999-9999 */
export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}
