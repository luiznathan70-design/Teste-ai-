"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays, Clock, Cog, ExternalLink, LayoutDashboard, LogOut, MapPinned, Megaphone, Menu,
  MessageSquareQuote, Package, PizzaIcon, PlusSquare, Receipt, Shapes, Soup, Ticket, Users, X,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const GROUPS = [
  { title: "Operação", items: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/pedidos", label: "Pedidos", icon: Receipt },
    { href: "/admin/cardapio-do-dia", label: "Cardápio do dia", icon: Soup },
  ] },
  { title: "Cardápio", items: [
    { href: "/admin/produtos", label: "Produtos", icon: Package },
    { href: "/admin/categorias", label: "Categorias", icon: Shapes },
    { href: "/admin/pizzas", label: "Tamanhos e bordas", icon: PizzaIcon },
    { href: "/admin/adicionais", label: "Adicionais", icon: PlusSquare },
  ] },
  { title: "Vendas", items: [
    { href: "/admin/cupons", label: "Cupons", icon: Ticket },
    { href: "/admin/promocoes", label: "Promoções", icon: Megaphone },
    { href: "/admin/depoimentos", label: "Depoimentos", icon: MessageSquareQuote },
    { href: "/admin/clientes", label: "Clientes", icon: Users },
  ] },
  { title: "Loja", items: [
    { href: "/admin/bairros", label: "Bairros e taxas", icon: MapPinned },
    { href: "/admin/horarios", label: "Horários", icon: Clock },
    { href: "/admin/configuracoes", label: "Configurações", icon: Cog },
  ] },
];

export function AdminSidebar({ name, userName, logout }: { name: string; userName: string; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  const nav = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1 text-[10px] font-bold tracking-widest text-creme-200/50 uppercase">{g.title}</p>
          {g.items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                isActive(href) ? "bg-brasa-600 text-white shadow" : "text-creme-200/90 hover:bg-white/10",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-3 text-sm">
      <Link href="/" target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-creme-200/80 hover:bg-white/10">
        <ExternalLink className="h-4 w-4" /> Ver site
      </Link>
      <form action={logout}>
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-creme-200/80 hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Sair ({userName})
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Barra superior no celular */}
      <div className="no-print sticky top-0 z-40 flex h-14 items-center justify-between bg-wood px-4 text-creme-100 lg:hidden">
        <Logo name={name} />
        <button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="h-6 w-6" /></button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative flex w-72 flex-col bg-wood text-creme-100">
            <div className="flex h-16 items-center justify-between px-4">
              <Logo name={name} />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-wood text-creme-100 lg:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <Logo name={name} />
        </div>
        <div className="flex items-center gap-2 px-6 text-xs text-creme-200/60"><CalendarDays className="h-3 w-3" /> Painel administrativo</div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
