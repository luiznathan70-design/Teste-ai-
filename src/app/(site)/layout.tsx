import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { getHours, getSettings } from "@/lib/catalog";
import { auth } from "@/auth";

// Conteúdo vem do banco e depende do horário atual
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, hours, session] = await Promise.all([getSettings(), getHours(), auth()]);
  return (
    <div className="flex min-h-dvh flex-col">
      <Header name={settings.name} logoUrl={settings.logoUrl} loggedIn={!!session?.user} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} hours={hours} />
      <WhatsAppButton phone={settings.whatsapp} />
      <CartDrawer />
    </div>
  );
}
