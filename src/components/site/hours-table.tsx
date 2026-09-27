import { SECTOR_LABELS, WEEKDAYS, type Sector } from "@/lib/constants";

/** Tabela de horários por setor e dia da semana */
export function HoursTable({ hours }: { hours: { sector: string; weekday: number; opensAt: string; closesAt: string }[] }) {
  const sectors: Sector[] = ["ALMOCO", "CHURRASCO", "PIZZARIA", "LANCHES"];
  return (
    <div className="space-y-4">
      {sectors.map((s) => {
        // Agrupa dias com o mesmo horário: "Seg a Sex: 11:00–14:30"
        const byLabel = new Map<string, number[]>();
        for (let d = 0; d < 7; d++) {
          const label = hours.filter((h) => h.sector === s && h.weekday === d).map((h) => `${h.opensAt}–${h.closesAt}`).join(" e ") || "Fechado";
          byLabel.set(label, [...(byLabel.get(label) ?? []), d]);
        }
        return (
          <div key={s}>
            <p className="font-bold text-madeira-800">{SECTOR_LABELS[s]}</p>
            <ul className="text-sm text-madeira-600">
              {[...byLabel.entries()].map(([label, days]) => (
                <li key={label} className="flex justify-between gap-4 border-b border-dashed border-madeira-100 py-1">
                  <span>{days.map((d) => WEEKDAYS[d].slice(0, 3)).join(", ")}</span>
                  <span className={label === "Fechado" ? "text-madeira-300" : "font-semibold"}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
