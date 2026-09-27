import type { Metadata } from "next";
import Link from "next/link";
import { Flame, HeartHandshake, Leaf, Trophy } from "lucide-react";
import { getSettings } from "@/lib/catalog";
import { SafeImage } from "@/components/ui/safe-image";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sobre nós" };

const VALUES = [
  { icon: Flame, title: "Forno a lenha e brasa", text: "Pizza e churrasco feitos no fogo de verdade, como no rancho." },
  { icon: Leaf, title: "Ingredientes frescos", text: "Hortaliças do produtor local e carnes selecionadas todos os dias." },
  { icon: HeartHandshake, title: "Jeito de família", text: "Atendimento acolhedor de quem recebe visita na varanda." },
  { icon: Trophy, title: "Capricho em tudo", text: "Do almoço de segunda à pizza de sábado, o mesmo cuidado." },
];

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-wood py-20 text-creme-100">
        <SafeImage src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80" alt="Salão do restaurante" fill sizes="100vw" className="-z-10 object-cover opacity-30" />
        <div className="container-page text-center">
          <p className="font-western tracking-widest text-milho-400">Nossa história</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Um pedacinho do rancho na cidade</h1>
        </div>
      </section>
      <section className="container-page grid gap-10 py-16 lg:grid-cols-2">
        <div className="space-y-4 text-lg leading-relaxed text-madeira-700">
          {settings.aboutText.split("\n").filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <Link href="/cardapio" className={buttonClasses("primary", "lg", "mt-4")}>Conheça o cardápio</Link>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card">
          <SafeImage src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1000&q=80" alt="Churrasco na brasa" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
        </div>
      </section>
      <section className="bg-creme-200/60 py-16">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white p-6 text-center shadow-card">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brasa-600 text-creme-100">
                <Icon className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl text-madeira-800">{title}</h2>
              <p className="mt-2 text-sm text-madeira-500">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
