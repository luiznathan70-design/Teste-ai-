/**
 * Regras de preço do cardápio. Módulo PURO (sem acesso ao banco): é usado no
 * navegador para mostrar o preço enquanto o cliente personaliza e no servidor
 * para recalcular tudo no checkout — o total enviado pelo cliente é ignorado.
 */

export type CatalogAddonGroup = {
  id: number;
  name: string;
  minSelect: number;
  maxSelect: number;
  addons: { id: number; name: string; price: number }[];
};

export type CatalogProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  kind: string; // SIMPLE | PIZZA | VARIANT
  basePrice: number;
  paused: boolean;
  featured: boolean;
  tags: string[];
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  sector: string;
  variants: { id: number; name: string; price: number }[];
  pizzaPrices: { sizeId: number; price: number }[];
  addonGroups: CatalogAddonGroup[];
};

export type PizzaCatalog = {
  sizes: { id: number; name: string; slices: number; maxFlavors: number }[];
  crusts: { id: number; name: string; prices: { sizeId: number; price: number }[] }[];
};

/** O que o cliente escolheu para um item do carrinho */
export type ItemSelection = {
  productId: number;
  quantity: number;
  sizeId?: number;
  flavorIds?: number[]; // pizza: inclui o sabor principal
  crustId?: number | null;
  variantId?: number;
  addonIds?: number[];
  notes?: string;
};

export type PricedItem = {
  productId: number;
  name: string;
  sector: string;
  details: string[];
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  notes?: string;
};

export class PricingError extends Error {}

/** Menor preço exibido no card do produto ("a partir de") */
export function startingPrice(p: CatalogProduct): number {
  if (p.kind === "PIZZA") return p.pizzaPrices.length ? Math.min(...p.pizzaPrices.map((x) => x.price)) : 0;
  if (p.kind === "VARIANT") return p.variants.length ? Math.min(...p.variants.map((x) => x.price)) : 0;
  return p.basePrice;
}

export function hasOptions(p: CatalogProduct) {
  return p.kind !== "SIMPLE" || p.addonGroups.some((g) => g.addons.length > 0);
}

/**
 * Calcula preço e descrição de um item.
 * Pizza meio a meio: cobra o valor do sabor MAIS CARO no tamanho escolhido.
 */
export function priceItem(
  sel: ItemSelection,
  products: Map<number, CatalogProduct>,
  pizza: PizzaCatalog,
): PricedItem {
  const product = products.get(sel.productId);
  if (!product) throw new PricingError("Produto não encontrado.");
  if (product.paused) throw new PricingError(`${product.name} está indisponível no momento.`);

  const quantity = Math.max(1, Math.min(99, Math.floor(sel.quantity || 1)));
  const details: string[] = [];
  let unit = 0;
  let name = product.name;

  if (product.kind === "PIZZA") {
    const size = pizza.sizes.find((s) => s.id === sel.sizeId);
    if (!size) throw new PricingError("Escolha o tamanho da pizza.");

    const flavorIds = Array.from(new Set([product.id, ...(sel.flavorIds ?? [])]));
    if (flavorIds.length > size.maxFlavors)
      throw new PricingError(`A pizza ${size.name} aceita até ${size.maxFlavors} sabor(es).`);

    const flavors = flavorIds.map((id) => {
      const f = products.get(id);
      if (!f || f.kind !== "PIZZA") throw new PricingError("Sabor inválido.");
      if (f.paused) throw new PricingError(`O sabor ${f.name} está indisponível.`);
      const price = f.pizzaPrices.find((pp) => pp.sizeId === size.id)?.price;
      if (price === undefined) throw new PricingError(`${f.name} não está disponível no tamanho ${size.name}.`);
      return { name: f.name, price };
    });

    unit = Math.max(...flavors.map((f) => f.price));
    name = flavors.length > 1 ? `Pizza ${size.name} — ${flavors.length} sabores` : `Pizza ${product.name}`;
    details.push(`Tamanho: ${size.name} (${size.slices} fatias)`);
    if (flavors.length > 1) {
      const fraction = flavors.length === 2 ? "1/2" : "1/3";
      details.push(`Sabores: ${flavors.map((f) => `${fraction} ${f.name}`).join(", ")}`);
    }

    if (sel.crustId) {
      const crust = pizza.crusts.find((c) => c.id === sel.crustId);
      const crustPrice = crust?.prices.find((cp) => cp.sizeId === size.id)?.price;
      if (!crust || crustPrice === undefined) throw new PricingError("Borda inválida para este tamanho.");
      unit += crustPrice;
      details.push(`Borda: ${crust.name}`);
    }
  } else if (product.kind === "VARIANT") {
    const variant = product.variants.find((v) => v.id === sel.variantId);
    if (!variant) throw new PricingError(`Escolha uma opção para ${product.name}.`);
    unit = variant.price;
    details.push(variant.name);
  } else {
    unit = product.basePrice;
  }

  // Adicionais (lanches, porções, marmitex...)
  const addonIds = sel.addonIds ?? [];
  for (const group of product.addonGroups) {
    const chosen = group.addons.filter((a) => addonIds.includes(a.id));
    if (chosen.length < group.minSelect) throw new PricingError(`Escolha ao menos ${group.minSelect} em "${group.name}".`);
    if (chosen.length > group.maxSelect) throw new PricingError(`Escolha no máximo ${group.maxSelect} em "${group.name}".`);
    for (const a of chosen) {
      unit += a.price;
      details.push(`+ ${a.name}`);
    }
  }
  const validAddonIds = new Set(product.addonGroups.flatMap((g) => g.addons.map((a) => a.id)));
  if (addonIds.some((id) => !validAddonIds.has(id))) throw new PricingError("Adicional inválido.");

  const notes = sel.notes?.trim().slice(0, 200) || undefined;
  return { productId: product.id, name, sector: product.sector, details, unitPrice: unit, totalPrice: unit * quantity, quantity, notes };
}

export type CouponRule = { code: string; type: string; value: number; minOrder: number };

/** Valor do desconto de um cupom sobre o subtotal (nunca maior que o subtotal) */
export function couponDiscount(coupon: CouponRule, subtotal: number) {
  if (subtotal < coupon.minOrder) return 0;
  const raw = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(raw, subtotal);
}
