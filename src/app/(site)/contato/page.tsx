import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getHours, getSettings } from "@/lib/catalog";
import { whatsappLink } from "@/lib/whatsapp";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { MapEmbed } from "@/components/site/map-embed";
import { HoursTable } from "@/components/site/hours-table";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contato" };

export default async function ContactPage() {
  const [settings, hours] = await Promise.all([getSettings(), getHours()]);
  const fullAddress = `${settings.address}, ${settings.city}`;
  return (
    <div className="container-page py-10">
      <h1 className="text-4xl text-madeira-800">Fale com a gente</h1>
      <p className="mt-2 text-madeira-500">Dúvidas, encomendas para festas ou sugestões — responderemos rapidinho.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 p-6">
          <a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "lg", "w-full bg-[#25D366] hover:bg-[#1ebe5b]")}>
            <WhatsAppIcon className="h-5 w-5" /> Chamar no WhatsApp
          </a>
          <p className="flex gap-3 text-madeira-700"><Phone className="h-5 w-5 shrink-0 text-brasa-600" />{settings.phone}</p>
          {settings.email && <p className="flex gap-3 text-madeira-700"><Mail className="h-5 w-5 shrink-0 text-brasa-600" />{settings.email}</p>}
          <p className="flex gap-3 text-madeira-700"><MapPin className="h-5 w-5 shrink-0 text-brasa-600" />{fullAddress}</p>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-xl text-madeira-800">Envie uma mensagem</h2>
          <ContactForm whatsapp={settings.whatsapp} />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-xl text-madeira-800">Horários</h2>
          <HoursTable hours={hours} />
        </Card>
        <MapEmbed address={fullAddress} className="h-96 w-full rounded-2xl border-0 shadow-card lg:col-span-2" />
      </div>
    </div>
  );
}
