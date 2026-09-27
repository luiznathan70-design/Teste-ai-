"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Beef, CakeSlice, CupSoda, Pizza, Sandwich, Search, Soup, X } from "lucide-react";
import { Input } from "@/components/ui/form";
import { ProductCard } from "./product-card";
import { ProductCustomizer } from "./product-customizer";
import type { CatalogProduct, PizzaCatalog } from "@/lib/pricing";
import { normalizeSearch, cn } from "@/lib/utils";

// Abas do cardápio: cada uma agrupa um setor
const TABS = [
  { sector: "PIZZARIA", label: "Pizzas", icon: Pizza },
  { sector: "LANCHES", label: "Lanches", icon: Sandwich },
  { sector: "ALMOCO", label: "Almoço", icon: Soup },
  { sector: "CHURRASCO", label: "Churrasco", icon: Beef },
  { sector: "BEBIDAS", label: "Bebidas", icon: CupSoda },
  { sector: "SOBREMESAS", label: "Sobremesas", icon: CakeSlice },
] as const;

const FILTERS = [
  { key: "disponiveis", label: "Disponíveis agora" },
  { key: "destaques", label: "Destaques" },
  { key: "vegetariano", label: "Vegetariano" },
  { key: "picante", label: "Picante" },
  { key: "doce", label: "Doce" },
];

type Props = {
  categories: { id: number; name: string; slug: string; sector: string }[];
  products: CatalogProduct[];
  pizza: PizzaCatalog;
  openSectors: Record<string, boolean>;
  sectorHours: Record<string, string>;
};

export function MenuBrowser({ categories, products, pizza, openSectors, sectorHours }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const initialCategory = categories.find((c) => c.slug === params.get("categoria"));
  const [tab, setTab] = useState<string>(initialCategory?.sector ?? params.get("setor")?.toUpperCase() ?? "PIZZARIA");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const selected = products.find((p) => p.slug === params.get("produto")) ?? null;

  useEffect(() => {
    if (initialCategory) document.getElementById(`cat-${initialCategory.slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initialCategory]);

  const isAvailable = (p: CatalogProduct) => !p.paused && openSectors[p.sector] !== false;

  const searching = query.trim().length > 0;
  const q = normalizeSearch(query.trim());

  const visible = products.filter((p) => {
    if (!searching && p.sector !== tab) return false;
    if (searching && !normalizeSearch(`${p.name} ${p.description} ${p.categoryName}`).includes(q)) return false;
    for (const f of filters) {
      if (f === "disponiveis" && !isAvailable(p)) return false;
      if (f === "destaques" && !p.featured) return false;
      if (["vegetariano", "picante", "doce"].includes(f) && !p.tags.includes(f)) return false;
    }
    return true;
  });

  const grouped = categories
    .map((c) => ({ category: c, items: visible.filter((p) => p.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);

  function openProduct(p: CatalogProduct) {
    const sp = new URLSearchParams(params.toString());
    sp.set("produto", p.slug);
    router.replace(`/cardapio?${sp.toString()}`, { scroll: false });
  }

  function closeProduct() {
    const sp = new URLSearchParams(params.toString());
    sp.delete("produto");
    router.replace(`/cardapio${sp.size ? `?${sp.toString()}` : ""}`, { scroll: false });
  }

  return (
    <div>
      {/* Busca + abas fixas no topo ao rolar */}
      <div className="sticky top-[70px] z-20 -mx-4 bg-creme-100/95 px-4 pt-3 pb-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-madeira-300" />
          <Input
            className="h-11 pl-9"
            placeholder="Buscar no cardápio: calabresa, picanha, x-tudo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar no cardápio"
          />
          {query && (
            <button className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-madeira-400" onClick={() => setQuery("")} aria-label="Limpar busca">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!searching && (
          <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
            {TABS.map(({ sector, label, icon: Icon }) => (
              <button
                key={sector}
                role="tab"
                aria-selected={tab === sector}
                onClick={() => setTab(sector)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition",
                  tab === sector ? "border-brasa-600 bg-brasa-600 text-white shadow" : "border-madeira-200 bg-white text-madeira-700 hover:border-madeira-300",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {openSectors[sector] === false && <span className="h-2 w-2 rounded-full bg-madeira-300" title="Fechado agora" />}
              </button>
            ))}
          </div>
        )}

        <div className="scrollbar-none -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => {
            const active = filters.includes(f.key);
            return (
              <button
                key={f.key}
                onClick={() => setFilters((cur) => (active ? cur.filter((x) => x !== f.key) : [...cur, f.key]))}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                  active ? "border-madeira-700 bg-madeira-700 text-creme-100" : "border-madeira-200 bg-white text-madeira-600",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {!searching && openSectors[tab] === false && (
        <div className="mt-4 rounded-2xl border border-milho-400 bg-milho-300/30 p-4 text-sm text-madeira-800">
          <strong>{TABS.find((t) => t.sector === tab)?.label}</strong> está fechado agora. Horário de hoje:{" "}
          <strong>{sectorHours[tab]}</strong>. Você pode ver o cardápio, mas os itens ficam indisponíveis até abrir.
        </div>
      )}

      <div className="mt-4 space-y-10 pb-10">
        {grouped.length === 0 && (
          <p className="py-16 text-center text-madeira-500">Nenhum item encontrado. Tente outra busca ou remova os filtros.</p>
        )}
        {grouped.map(({ category, items }) => (
          <section key={category.id} id={`cat-${category.slug}`} className="scroll-mt-48">
            <h2 className="mb-4 text-2xl text-madeira-800">{category.name}</h2>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} available={isAvailable(p)} onSelect={() => openProduct(p)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <ProductCustomizer
          key={selected.id}
          product={selected}
          products={productMap}
          pizza={pizza}
          available={isAvailable(selected)}
          onClose={closeProduct}
        />
      )}
    </div>
  );
}
