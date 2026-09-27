import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappLink } from "@/lib/whatsapp";

/** Botão flutuante do WhatsApp (canto inferior direito) */
export function WhatsAppButton({ phone }: { phone: string }) {
  if (!phone) return null;
  return (
    <a
      href={whatsappLink(phone, "Olá! Vim pelo site da Ranchos Pizzaria 🍕")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105 pb-[env(safe-area-inset-bottom)]"
      aria-label="Fale conosco no WhatsApp"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
