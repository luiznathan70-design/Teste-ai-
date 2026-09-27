import { TIMEZONE, type Sector } from "./constants";

export type HourRow = { sector: string; weekday: number; opensAt: string; closesAt: string };

/** Data/hora atual no fuso de São Paulo: { weekday, minutes, isoDate } */
export function nowInBrazil(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  const isoDate = `${get("year")}-${get("month")}-${get("day")}`;
  return { weekday, minutes, isoDate };
}

/** "YYYY-MM-DD" de hoje no fuso de São Paulo */
export function todayISO() {
  return nowInBrazil().isoDate;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Verifica se um setor está aberto agora.
 * Considera turnos que atravessam a meia-noite (ex.: 18:00–01:00).
 */
export function isSectorOpen(sector: Sector | string, hours: HourRow[], date = new Date()) {
  const { weekday, minutes } = nowInBrazil(date);
  const yesterday = (weekday + 6) % 7;
  return hours.some((h) => {
    if (h.sector !== sector) return false;
    const open = toMinutes(h.opensAt);
    const close = toMinutes(h.closesAt);
    if (close > open) return h.weekday === weekday && minutes >= open && minutes < close;
    // Turno que passa da meia-noite
    return (h.weekday === weekday && minutes >= open) || (h.weekday === yesterday && minutes < close);
  });
}

/** Mapa setor -> aberto? */
export function openSectors(hours: HourRow[], date = new Date()) {
  const result: Record<string, boolean> = {};
  for (const h of hours) result[h.sector] ??= false;
  for (const sector of Object.keys(result)) result[sector] = isSectorOpen(sector, hours, date);
  return result;
}

/** Texto dos horários de hoje para um setor: "11:00–14:30" */
export function todayHoursLabel(sector: string, hours: HourRow[]) {
  const { weekday } = nowInBrazil();
  const today = hours.filter((h) => h.sector === sector && h.weekday === weekday);
  if (!today.length) return "Fechado hoje";
  return today.map((h) => `${h.opensAt}–${h.closesAt}`).join(" / ");
}
