import Link from "next/link";
import { AtSign, Clock, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { SECTOR_LABELS, type Sector } from "@/lib/constants";
import { todayHoursLabel, type HourRow } from "@/lib/hours";

type Props = {
  settings: { name: string; slogan: string; phone: string; address: string; city: string; instagram: string | null };
  hours: HourRow[];
};

export function Footer({ settings, hours }: Props) {
  const sectors: Sector[] = ["ALMOCO", "CHURRASCO", "PIZZARIA", "LANCHES"];
  return (
    <footer className="bg-wood text-creme-200">
      <div className="h-1.5 bg-checker" />
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo name={settings.name} />
          <p className="mt-4 text-sm text-creme-200/80">{settings.slogan}</p>
        </div>
        <div>
          <h3 className="mb-3 text-lg text-milho-400">Horários de hoje</h3>
          <ul className="space-y-1 text-sm">
            {sectors.map((s) => (
              <li key={s} className="flex justify-between gap-4">
                <span>{SECTOR_LABELS[s]}</span>
                <span className="text-creme-200/80">{todayHoursLabel(s, hours)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-lg text-milho-400">Contato</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 translate-y-0.5" />{settings.address} — {settings.city}</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 translate-y-0.5" />{settings.phone}</li>
            {settings.instagram && (
              <li className="flex gap-2"><AtSign className="h-4 w-4 shrink-0 translate-y-0.5" />@{settings.instagram}</li>
            )}
            <li className="flex gap-2"><Clock className="h-4 w-4 shrink-0 translate-y-0.5" /><Link href="/contato" className="underline">Todos os horários</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-lg text-milho-400">Navegue</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/cardapio" className="hover:text-white">Cardápio completo</Link></li>
            <li><Link href="/cardapio-do-dia" className="hover:text-white">Cardápio do dia</Link></li>
            <li><Link href="/conta" className="hover:text-white">Meus pedidos</Link></li>
            <li><Link href="/sobre" className="hover:text-white">Nossa história</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-creme-200/60">
        © {new Date().getFullYear()} {settings.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
