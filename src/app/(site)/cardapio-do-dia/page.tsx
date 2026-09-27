import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Scale } from "lucide-react";
import { db } from "@/lib/db";
import { getHours, loadCatalog } from "@/lib/catalog";
import { isSectorOpen, todayHoursLabel, todayISO } from "@/lib/hours";
import { DAILY_SECTIONS, DAILY_SECTION_LABELS } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { startingPrice } from "@/lib/pricing";
import { Badge, Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";

export const metadata: Metadata = { title: "Cardápio do dia" };

export default async function DailyMenuPage() {
  const today = todayISO();
  const [menu, hours, catalog] = await Promise.all([
    db.dailyMenu.findUnique({ where: { date: today }, include: { items: { orderBy: { sortOrder: "asc" } } } }),
    getHours(),
    loadCatalog(),
  ]);
  const open = isSectorOpen("ALMOCO", hours);
  const lunchProducts = catalog.products.filter((p) => p.sector === "ALMOCO" && !p.paused);

  return (
    <div className="container-page py-8">
      <div className="overflow-hidden rounded-3xl bg-wood text-creme-100 shadow-card">
        <div className="grid md:grid-cols-2">
          <div className="p-6 sm:p-10">
            <p className="font-western tracking-wide text-milho-400">Self-service</p>
            <h1 className="mt-1 text-4xl">Cardápio do dia</h1>
            <p className="mt-2 capitalize text-creme-200/80">{formatDate(new Date())}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge tone={open ? "green" : "yellow"} className="px-3 py-1 text-sm">
                <Clock className="h-4 w-4" /> {open ? "Aberto agora" : "Fechado agora"} · {todayHoursLabel("ALMOCO", hours)}
              </Badge>
              {menu && (
                <Badge tone="yellow" className="bg-milho-400 px-3 py-1 text-sm">
                  <Scale className="h-4 w-4" /> Buffet: {formatMoney(menu.pricePerKg)}/kg
                </Badge>
              )}
            </div>
            {menu?.notes && <p className="mt-6 rounded-xl bg-white/10 p-4 text-sm">{menu.notes}</p>}
          </div>
          <div className="relative hidden min-h-64 md:block">
            <SafeImage src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=80" alt="Buffet do almoço" fill sizes="50vw" className="object-cover" />
          </div>
        </div>
      </div>

      {!menu ? (
        <Card className="mt-8 p-10 text-center">
          <p className="text-lg font-semibold text-madeira-700">O cardápio de hoje ainda não foi publicado.</p>
          <p className="mt-1 text-madeira-500">Volte mais tarde ou fale com a gente pelo WhatsApp.</p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DAILY_SECTIONS.map((section) => {
            const items = menu.items.filter((i) => i.section === section);
            if (!items.length) return null;
            return (
              <Card key={section} className="p-5">
                <h2 className="mb-3 text-xl text-brasa-700">{DAILY_SECTION_LABELS[section]}</h2>
                <ul className="space-y-2">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-start gap-2 text-madeira-800">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-milho-500" />
                      {i.name}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <section className="mt-12">
        <h2 className="mb-4 text-2xl text-madeira-800">Peça sua marmitex</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lunchProducts.map((p) => (
            <Link key={p.id} href={`/cardapio?produto=${p.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="relative aspect-[4/3] overflow-hidden">
                <SafeImage src={p.imageUrl} alt={p.name} fill sizes="25vw" className="object-cover transition group-hover:scale-105" />
              </div>
              <div className="p-4">
                <p className="font-bold">{p.name}</p>
                <p className="line-clamp-2 text-sm text-madeira-500">{p.description}</p>
                <p className="mt-2 font-extrabold text-brasa-700">
                  {p.kind !== "SIMPLE" && <span className="mr-1 text-xs font-medium text-madeira-400">a partir de</span>}
                  {formatMoney(startingPrice(p))}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/cardapio?setor=almoco" className={buttonClasses("primary", "lg")}>Pedir almoço</Link>
        </div>
      </section>
    </div>
  );
}
