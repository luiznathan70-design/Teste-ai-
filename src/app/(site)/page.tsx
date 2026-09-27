import Link from "next/link";
import { ArrowRight, Clock, MapPin, Phone, Star } from "lucide-react";
import { db } from "@/lib/db";
import { getHours, getSettings } from "@/lib/catalog";
import { isSectorOpen, todayHoursLabel } from "@/lib/hours";
import type { Sector } from "@/lib/constants";
import { HoursTable } from "@/components/site/hours-table";
import { formatMoney } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge, Card, SectionTitle } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { MapEmbed } from "@/components/site/map-embed";
import { WhatsAppIcon } from "@/components/ui/icons";
import { startingPrice } from "@/lib/pricing";
import { loadCatalog } from "@/lib/catalog";

const HERO_IMAGE = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1920&q=80";

// As 4 frentes do restaurante
const FRONTS: { sector: Sector; title: string; text: string; image: string; href: string }[] = [
  {
    sector: "PIZZARIA",
    title: "Pizzaria",
    text: "Massa de longa fermentação, forno a lenha e bordas recheadas. Meio a meio em até 3 sabores.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    href: "/cardapio?setor=pizzaria",
  },
  {
    sector: "LANCHES",
    title: "Lanches",
    text: "Hambúrgueres artesanais, X-tudo caprichado, dogs prensados e porções para dividir.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    href: "/cardapio?setor=lanches",
  },
  {
    sector: "ALMOCO",
    title: "Almoço",
    text: "Self-service por quilo e marmitex P, M e G com comida caseira que muda todo dia.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    href: "/cardapio-do-dia",
  },
  {
    sector: "CHURRASCO",
    title: "Churrasco",
    text: "Carnes na brasa por quilo, espetinhos e kits completos para a família levar.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    href: "/cardapio?setor=churrasco",
  },
];

export default async function HomePage() {
  const now = new Date();
  const [settings, hours, promotions, testimonials, catalog] = await Promise.all([
    getSettings(),
    getHours(),
    db.promotion.findMany({
      where: {
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: "asc" },
    }),
    db.testimonial.findMany({ where: { active: true }, take: 6 }),
    loadCatalog(),
  ]);

  const featured = catalog.products.filter((p) => p.featured && !p.paused).slice(0, 8);
  const anyOpen = FRONTS.some((f) => isSectorOpen(f.sector, hours));
  const fullAddress = `${settings.address}, ${settings.city}`;

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <SafeImage src={HERO_IMAGE} alt="Pizza saindo do forno a lenha" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-madeira-900/95 via-madeira-900/80 to-madeira-900/30" />
        <div className="container-page py-20 text-creme-100 sm:py-28 lg:py-36">
          <Badge tone={anyOpen ? "green" : "yellow"} className="mb-5 px-3 py-1 text-sm">
            <span className={`h-2 w-2 rounded-full ${anyOpen ? "bg-emerald-500" : "bg-milho-500"}`} />
            {anyOpen ? "Aberto agora — peça já!" : "Fechado agora — agende seu pedido"}
          </Badge>
          <p className="font-western text-lg tracking-wide text-milho-400 sm:text-xl">Bem-vindo ao rancho</p>
          <h1 className="mt-2 max-w-2xl text-4xl leading-tight sm:text-6xl">
            Sabor de fazenda, <span className="text-milho-400">do forno</span> à <span className="text-brasa-500">brasa</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-creme-200/90">
            Pizzas, lanches, almoço caseiro e churrasco num só lugar. Peça pelo celular e receba quentinho em casa.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/cardapio" className={buttonClasses("primary", "lg")}>
              Fazer pedido <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/cardapio-do-dia" className={buttonClasses("secondary", "lg")}>
              Cardápio do dia
            </Link>
          </div>
        </div>
      </section>

      {/* 4 FRENTES */}
      <section className="container-page -mt-10 relative z-10 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FRONTS.map((f) => {
            const open = isSectorOpen(f.sector, hours);
            return (
              <Link key={f.sector} href={f.href} className="group overflow-hidden rounded-3xl bg-white shadow-card transition hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SafeImage src={f.image} alt={f.title} fill sizes="(max-width:640px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-madeira-900/80 to-transparent" />
                  <h2 className="absolute bottom-3 left-4 text-3xl text-creme-100">{f.title}</h2>
                  <Badge tone={open ? "green" : "neutral"} className="absolute top-3 right-3">
                    {open ? "Aberto" : "Fechado"}
                  </Badge>
                </div>
                <div className="p-4">
                  <p className="text-sm text-madeira-600">{f.text}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-madeira-500">
                    <Clock className="h-3.5 w-3.5" /> Hoje: {todayHoursLabel(f.sector, hours)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* PROMOÇÕES */}
      {promotions.length > 0 && (
        <section className="bg-creme-200/60 py-16">
          <div className="container-page">
            <SectionTitle eyebrow="Imperdível" title="Promoções da casa" />
            <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
              {promotions.map((p) => (
                <Link
                  key={p.id}
                  href={p.link || "/cardapio"}
                  className="relative w-[85%] shrink-0 snap-start overflow-hidden rounded-3xl bg-madeira-800 text-creme-100 shadow-card sm:w-auto"
                >
                  <div className="relative aspect-[16/10]">
                    <SafeImage src={p.imageUrl} alt={p.title} fill sizes="(max-width:640px) 85vw, 33vw" className="object-cover opacity-70" />
                    {p.badge && <span className="absolute top-3 left-3 rounded-full bg-milho-400 px-3 py-1 text-sm font-extrabold text-madeira-900">{p.badge}</span>}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl text-milho-400">{p.title}</h3>
                    <p className="mt-1 text-sm text-creme-200/90">{p.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DESTAQUES */}
      {featured.length > 0 && (
        <section className="container-page py-16">
          <SectionTitle eyebrow="Os queridinhos" title="Mais pedidos da casa" />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {featured.map((p) => (
              <Link key={p.id} href={`/cardapio?produto=${p.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-card">
                <div className="relative aspect-square overflow-hidden">
                  <SafeImage src={p.imageUrl} alt={p.name} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-110" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-madeira-400 uppercase">{p.categoryName}</p>
                  <p className="font-bold text-madeira-900">{p.name}</p>
                  <p className="mt-1 font-extrabold text-brasa-700">
                    {p.kind !== "SIMPLE" && <span className="mr-1 text-xs font-medium text-madeira-400">a partir de</span>}
                    {formatMoney(startingPrice(p))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/cardapio" className={buttonClasses("wood", "lg")}>
              Ver cardápio completo
            </Link>
          </div>
        </section>
      )}

      {/* DEPOIMENTOS */}
      {testimonials.length > 0 && (
        <section className="bg-wood py-16 text-creme-100">
          <div className="container-page">
            <SectionTitle eyebrow="Quem prova, volta" title="O que dizem nossos clientes" className="[&_h2]:text-creme-100" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((t) => (
                <figure key={t.id} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <div className="flex gap-0.5 text-milho-400" aria-label={`${t.rating} estrelas`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-current" : "opacity-30"}`} />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-sm text-creme-200/90">“{t.text}”</blockquote>
                  <figcaption className="mt-3 text-sm font-bold text-milho-400">{t.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HORÁRIOS E LOCALIZAÇÃO */}
      <section className="container-page py-16">
        <SectionTitle eyebrow="Venha nos visitar" title="Horários e localização" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 text-xl text-madeira-800">Horário de funcionamento</h3>
            <HoursTable hours={hours} />
            <div className="mt-6 space-y-2 text-sm text-madeira-700">
              <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 translate-y-0.5 text-brasa-600" />{fullAddress}</p>
              <p className="flex gap-2"><Phone className="h-4 w-4 shrink-0 translate-y-0.5 text-brasa-600" />{settings.phone}</p>
            </div>
            <a href={whatsappLink(settings.whatsapp, "Olá! Gostaria de fazer um pedido.")} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "md", "mt-6 bg-[#25D366] hover:bg-[#1ebe5b]")}>
              <WhatsAppIcon className="h-5 w-5" /> Pedir pelo WhatsApp
            </a>
          </Card>
          <MapEmbed address={fullAddress} className="h-80 w-full rounded-2xl border-0 shadow-card lg:h-full" />
        </div>
      </section>
    </>
  );
}
