import { getHours } from "@/lib/catalog";
import { saveHours } from "@/actions/admin/business";
import { SECTORS, SECTOR_LABELS, WEEKDAYS } from "@/lib/constants";
import { PageHeader } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";

export default async function HoursPage() {
  const hours = await getHours();
  return (
    <>
      <PageHeader
        title="Horários de funcionamento"
        description="Por setor e dia. Deixe em branco para fechado. Até 2 turnos por dia. Se o fechamento for menor que a abertura (ex.: 18:00–00:30), o turno passa da meia-noite."
      />
      <AdminForm action={saveHours} submitLabel="Salvar horários">
        <div className="grid gap-6 xl:grid-cols-2">
          {SECTORS.map((sector) => (
            <Card key={sector} className="overflow-x-auto p-5">
              <h2 className="mb-3 text-lg text-madeira-800">{SECTOR_LABELS[sector]}</h2>
              <table className="w-full min-w-[420px] text-sm">
                <thead className="text-xs text-madeira-400 uppercase">
                  <tr><th className="text-left">Dia</th><th colSpan={2}>Turno 1</th><th colSpan={2}>Turno 2</th></tr>
                </thead>
                <tbody>
                  {WEEKDAYS.map((day, d) => {
                    const rows = hours.filter((h) => h.sector === sector && h.weekday === d);
                    return (
                      <tr key={d}>
                        <td className="py-1 pr-2 font-medium">{day}</td>
                        {[1, 2].map((shift) => (
                          <td key={shift} colSpan={2} className="py-1">
                            <div className="flex items-center gap-1">
                              <Input type="time" name={`${sector}_${d}_${shift}_open`} defaultValue={rows[shift - 1]?.opensAt ?? ""} className="h-8 px-2" />
                              <span className="text-madeira-300">–</span>
                              <Input type="time" name={`${sector}_${d}_${shift}_close`} defaultValue={rows[shift - 1]?.closesAt ?? ""} className="h-8 px-2" />
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      </AdminForm>
    </>
  );
}
