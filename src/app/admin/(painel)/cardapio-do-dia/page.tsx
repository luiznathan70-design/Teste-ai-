import Link from "next/link";
import { db } from "@/lib/db";
import { todayISO } from "@/lib/hours";
import { saveDailyMenu } from "@/actions/admin/business";
import { DAILY_SECTIONS, DAILY_SECTION_LABELS } from "@/lib/constants";
import { centsToInput } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { buttonClasses } from "@/components/ui/button";

export default async function DailyMenuEditor({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { data } = await searchParams;
  const date = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : todayISO();
  const [menu, lastMenu] = await Promise.all([
    db.dailyMenu.findUnique({ where: { date }, include: { items: { orderBy: { sortOrder: "asc" } } } }),
    db.dailyMenu.findFirst({ where: { date: { lt: date } }, orderBy: { date: "desc" }, include: { items: { orderBy: { sortOrder: "asc" } } } }),
  ]);
  // Se o dia ainda não tem cardápio, sugere o último publicado como ponto de partida
  const base = menu ?? lastMenu;
  const itemsOf = (section: string) => base?.items.filter((i) => i.section === section).map((i) => i.name).join("\n") ?? "";

  const shift = (days: number) => {
    const d = new Date(`${date}T12:00:00-03:00`);
    d.setDate(d.getDate() + days);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
  };

  return (
    <>
      <PageHeader
        title="Cardápio do dia (self-service)"
        description={menu ? "Editando o cardápio publicado." : base ? "Ainda não publicado — preenchido com o último cardápio para agilizar." : "Ainda não publicado."}
        actions={
          <>
            <Link href={`?data=${shift(-1)}`} className={buttonClasses("outline", "sm")}>← Dia anterior</Link>
            <Link href={`?data=${shift(1)}`} className={buttonClasses("outline", "sm")}>Próximo dia →</Link>
          </>
        }
      />
      <Card className="p-5">
        <AdminForm action={saveDailyMenu} submitLabel="Publicar cardápio" key={date}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Data"><Input name="date" type="date" required defaultValue={date} /></Field>
            <Field label="Preço do quilo (R$)"><Input name="pricePerKg" inputMode="decimal" required defaultValue={centsToInput(base?.pricePerKg ?? 6990)} /></Field>
            <Field label="Aviso do dia" hint="Ex.: Hoje tem feijoada!"><Input name="notes" defaultValue={base?.notes} /></Field>
          </div>
          <p className="text-sm text-madeira-500">Um item por linha.</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {DAILY_SECTIONS.map((s) => (
              <Field key={s} label={DAILY_SECTION_LABELS[s]}>
                <Textarea name={`section_${s}`} rows={9} defaultValue={itemsOf(s)} />
              </Field>
            ))}
          </div>
        </AdminForm>
      </Card>
      <p className="mt-4 text-sm text-madeira-500">
        Os preços da marmitex P/M/G ficam no produto “Marmitex do Dia” em <Link href="/admin/produtos?tipo=VARIANT" className="underline">Produtos</Link>.
      </p>
    </>
  );
}
