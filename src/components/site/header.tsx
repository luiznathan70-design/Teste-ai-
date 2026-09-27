"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { useCart, cartCount } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/cardapio", label: "Cardápio" },
  { href: "/cardapio-do-dia", label: "Cardápio do dia" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header({ name, logoUrl, loggedIn }: { name: string; logoUrl?: string | null; loggedIn: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const count = hydrated ? cartCount(items) : 0;

  return (
    <header className="sticky top-0 z-40 bg-wood text-creme-100 shadow-lg">
      <div className="h-1.5 bg-checker" />
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <Logo name={name} logoUrl={logoUrl} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/10",
                pathname === item.href && "text-milho-400",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href={loggedIn ? "/conta" : "/conta/entrar"}
            className="hidden rounded-full p-2 hover:bg-white/10 sm:inline-flex"
            aria-label="Minha conta"
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            onClick={openCart}
            className="relative inline-flex items-center gap-2 rounded-full bg-brasa-600 px-4 py-2 text-sm font-bold shadow hover:bg-brasa-700"
            aria-label={`Carrinho com ${count} itens`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline">Carrinho</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-milho-400 px-1 text-xs font-bold text-madeira-900">
                {count}
              </span>
            )}
          </button>
          <button
            className="rounded-full p-2 hover:bg-white/10 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-white/10 md:hidden">
          <div className="container-page flex flex-col py-2">
            {[...NAV, { href: loggedIn ? "/conta" : "/conta/entrar", label: loggedIn ? "Minha conta" : "Entrar / Cadastrar" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn("rounded-lg px-3 py-3 font-semibold hover:bg-white/10", pathname === item.href && "text-milho-400")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
