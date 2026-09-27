import { parseMoney } from "@/lib/format";

export type AdminFormState = { error?: string; success?: string; at?: number } | undefined;

export const ok = (success: string): AdminFormState => ({ success, at: Date.now() });
export const fail = (error: string): AdminFormState => ({ error, at: Date.now() });

export const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export const optStr = (fd: FormData, key: string) => str(fd, key) || null;
export const int = (fd: FormData, key: string, fallback = 0) => {
  const n = Number(str(fd, key));
  return Number.isFinite(n) && str(fd, key) !== "" ? Math.round(n) : fallback;
};
export const optInt = (fd: FormData, key: string) => (str(fd, key) === "" ? null : int(fd, key));
export const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";
/** Lê um valor em reais ("49,90") e devolve centavos. */
export const money = (fd: FormData, key: string) => {
  const v = parseMoney(str(fd, key));
  return Number.isFinite(v) ? v : NaN;
};
export const optMoney = (fd: FormData, key: string) => (str(fd, key) === "" ? null : money(fd, key));
export const date = (fd: FormData, key: string) => {
  const v = str(fd, key);
  return v ? new Date(`${v}T23:59:59-03:00`) : null;
};
