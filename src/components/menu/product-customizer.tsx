"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, Search } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea, Input } from "@/components/ui/form";
import { SafeImage } from "@/components/ui/safe-image";
import { formatMoney } from "@/lib/format";
import { priceItem, PricingError, type CatalogProduct, type ItemSelection, type PizzaCatalog } from "@/lib/pricing";
import { normalizeSearch, cn } from "@/lib/utils";
import { useCart } from "@/store/cart";

/**
 * Modal de personalização do produto: tamanho, sabores (meio a meio),
 * borda, variações, adicionais, observação e quantidade.
 */
export function ProductCustomizer({
  product,
  products,
  pizza,
  available,
  onClose,
}: {
  product: CatalogProduct;
  products: Map<number, CatalogProduct>;
  pizza: PizzaCatalog;
  available: boolean;
  onClose: () => void;
}) {
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);

  const isPizza = product.kind === "PIZZA";
  const sizesForProduct = pizza.sizes.filter((s) => product.pizzaPrices.some((p) => p.sizeId === s.id));

  const [sizeId, setSizeId] = useState<number | undefined>(
    isPizza ? (sizesForProduct.find((s) => s.name === "Grande") ?? sizesForProduct[0])?.id : undefined,
  );
  const [extraFlavors, setExtraFlavors] = useState<number[]>([]);
  const [crustId, setCrustId] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<number | undefined>(product.variants[0]?.id);
  const [addonIds, setAddonIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [flavorSearch, setFlavorSearch] = useState("");

  const size = pizza.sizes.find((s) => s.id === sizeId);
  const maxExtra = size ? size.maxFlavors - 1 : 0;

  // Se trocar para um tamanho que aceita menos sabores, corta os excedentes
  const effectiveFlavors = extraFlavors.slice(0, maxExtra);

  const selection: ItemSelection = {
    productId: product.id,
    quantity,
    sizeId,
    flavorIds: isPizza ? [product.id, ...effectiveFlavors] : undefined,
    crustId,
    variantId,
    addonIds,
    notes,
  };

  const priced = useMemo(() => {
    try {
      return { ok: true as const, item: priceItem(selection, products, pizza) };
    } catch (e) {
      return { ok: false as const, error: e instanceof PricingError ? e.message : "Não foi possível calcular." };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selection), products, pizza]);

  const otherFlavors = useMemo(() => {
    if (!isPizza || !size) return [];
    const q = normalizeSearch(flavorSearch);
    return Array.from(products.values())
      .filter((p) => p.kind === "PIZZA" && p.id !== product.id && !p.paused && p.pizzaPrices.some((pp) => pp.sizeId === size.id))
      .filter((p) => !q || normalizeSearch(p.name).includes(q))
      .sort((a, b) => a.categoryId - b.categoryId || a.name.localeCompare(b.name));
  }, [isPizza, size, products, product.id, flavorSearch]);

  function toggleFlavor(id: number) {
    setExtraFlavors((cur) => {
      const current = cur.slice(0, maxExtra);
      if (current.includes(id)) return current.filter((f) => f !== id);
      if (current.length >= maxExtra) return maxExtra === 1 ? [id] : current;
      return [...current, id];
    });
  }

  function toggleAddon(groupMax: number, groupAddonIds: number[], id: number) {
    setAddonIds((cur) => {
      if (cur.includes(id)) return cur.filter((a) => a !== id);
      const inGroup = cur.filter((a) => groupAddonIds.includes(a));
      if (inGroup.length >= groupMax) return cur;
      return [...cur, id];
    });
  }

  function handleAdd() {
    if (!priced.ok) return;
    add({
      selection: { ...selection, flavorIds: selection.flavorIds, notes: notes.trim() || undefined },
      name: priced.item.name,
      imageUrl: product.imageUrl,
      details: priced.item.details,
      unitPrice: priced.item.unitPrice,
      sector: product.sector,
    });
    onClose();
    openCart();
  }

  const disabled = !available || product.paused;

  return (
    <Dialog
      open
      onClose={onClose}
      title={product.name}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-madeira-200 bg-white">
            <button className="p-2.5 text-madeira-600" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuir">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <button className="p-2.5 text-madeira-600" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Aumentar">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button size="lg" className="flex-1" disabled={disabled || !priced.ok} onClick={handleAdd}>
            {disabled ? "Indisponível agora" : priced.ok ? `Adicionar • ${formatMoney(priced.item.totalPrice)}` : "Complete as opções"}
          </Button>
        </div>
      }
    >
      <div className="relative -mx-5 -mt-4 mb-4 aspect-[16/9] overflow-hidden">
        <SafeImage src={product.imageUrl} alt={product.name} fill sizes="512px" className="object-cover" />
      </div>
      <p className="text-sm text-madeira-600">{product.description}</p>

      {isPizza && (
        <>
          <OptionSection title="Tamanho" required>
            <div className="grid grid-cols-2 gap-2">
              {sizesForProduct.map((s) => {
                const price = product.pizzaPrices.find((p) => p.sizeId === s.id)!.price;
                return (
                  <OptionTile key={s.id} selected={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                    <span className="font-bold">{s.name}</span>
                    <span className="text-xs text-madeira-500">
                      {s.slices} fatias · até {s.maxFlavors} {s.maxFlavors > 1 ? "sabores" : "sabor"}
                    </span>
                    <span className="text-sm font-semibold text-brasa-700">{formatMoney(price)}</span>
                  </OptionTile>
                );
              })}
            </div>
          </OptionSection>

          {maxExtra > 0 && (
            <OptionSection
              title={`Meio a meio (opcional)`}
              subtitle={`Escolha até ${maxExtra} sabor${maxExtra > 1 ? "es" : ""} a mais. Cobramos pelo sabor mais caro.`}
            >
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-madeira-300" />
                <Input className="pl-9" placeholder="Buscar sabor" value={flavorSearch} onChange={(e) => setFlavorSearch(e.target.value)} />
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {otherFlavors.map((f) => {
                  const selected = effectiveFlavors.includes(f.id);
                  const price = f.pizzaPrices.find((p) => p.sizeId === sizeId)!.price;
                  return (
                    <OptionRow key={f.id} selected={selected} onClick={() => toggleFlavor(f.id)}>
                      <span>
                        <span className="font-medium">{f.name}</span>
                        <span className="ml-2 text-xs text-madeira-400">{f.categoryName.replace("Pizzas ", "")}</span>
                      </span>
                      <span className="text-sm text-madeira-500">{formatMoney(price)}</span>
                    </OptionRow>
                  );
                })}
              </div>
            </OptionSection>
          )}

          {pizza.crusts.length > 0 && size && (
            <OptionSection title="Borda recheada (opcional)">
              <div className="space-y-1">
                <OptionRow selected={crustId === null} onClick={() => setCrustId(null)}>
                  <span className="font-medium">Sem borda recheada</span>
                </OptionRow>
                {pizza.crusts.map((c) => {
                  const price = c.prices.find((p) => p.sizeId === size.id)?.price;
                  if (price === undefined) return null;
                  return (
                    <OptionRow key={c.id} selected={crustId === c.id} onClick={() => setCrustId(c.id)}>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-sm text-madeira-500">+ {formatMoney(price)}</span>
                    </OptionRow>
                  );
                })}
              </div>
            </OptionSection>
          )}
        </>
      )}

      {product.kind === "VARIANT" && (
        <OptionSection title="Escolha uma opção" required>
          <div className="space-y-1">
            {product.variants.map((v) => (
              <OptionRow key={v.id} selected={variantId === v.id} onClick={() => setVariantId(v.id)}>
                <span className="font-medium">{v.name}</span>
                <span className="text-sm font-semibold text-brasa-700">{formatMoney(v.price)}</span>
              </OptionRow>
            ))}
          </div>
        </OptionSection>
      )}

      {product.addonGroups.map((g) => {
        const ids = g.addons.map((a) => a.id);
        return (
          <OptionSection key={g.id} title={g.name} subtitle={g.maxSelect < 10 ? `Até ${g.maxSelect} opções` : undefined} required={g.minSelect > 0}>
            <div className="space-y-1">
              {g.addons.map((a) => (
                <OptionRow key={a.id} multi selected={addonIds.includes(a.id)} onClick={() => toggleAddon(g.maxSelect, ids, a.id)}>
                  <span className="font-medium">{a.name}</span>
                  <span className="text-sm text-madeira-500">+ {formatMoney(a.price)}</span>
                </OptionRow>
              ))}
            </div>
          </OptionSection>
        );
      })}

      <OptionSection title="Observações">
        <Textarea
          value={notes}
          maxLength={200}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: sem cebola, carne ao ponto, bem passada..."
        />
      </OptionSection>

      {!priced.ok && !disabled && <p className="mt-2 text-sm text-brasa-700">{priced.error}</p>}
    </Dialog>
  );
}

function OptionSection({ title, subtitle, required, children }: { title: string; subtitle?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h4 className="font-sans text-sm font-bold tracking-normal text-madeira-800 uppercase">{title}</h4>
          {subtitle && <p className="text-xs text-madeira-500">{subtitle}</p>}
        </div>
        {required && <span className="rounded bg-madeira-700 px-1.5 py-0.5 text-[10px] font-bold text-creme-100 uppercase">Obrigatório</span>}
      </div>
      {children}
    </section>
  );
}

function OptionTile({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-xl border-2 bg-white p-3 text-left transition",
        selected ? "border-brasa-600 bg-brasa-50" : "border-madeira-100 hover:border-madeira-200",
      )}
    >
      {children}
    </button>
  );
}

function OptionRow({ selected, onClick, children, multi }: { selected: boolean; onClick: () => void; children: React.ReactNode; multi?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition",
        selected ? "border-brasa-500 bg-brasa-50" : "border-madeira-100 hover:border-madeira-200",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center border-2",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-brasa-600 bg-brasa-600 text-white" : "border-madeira-200",
        )}
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="flex flex-1 items-center justify-between gap-2">{children}</span>
    </button>
  );
}
