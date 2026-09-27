import "server-only";
import { db } from "./db";
import type { CatalogProduct, PizzaCatalog } from "./pricing";

/** Carrega o cardápio completo no formato usado pelo site e pelo cálculo de preços */
export async function loadCatalog(opts: { includeInactive?: boolean } = {}) {
  const [categories, products, sizes, crusts] = await Promise.all([
    db.category.findMany({
      where: opts.includeInactive ? {} : { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.product.findMany({
      where: opts.includeInactive ? {} : { category: { active: true } },
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
        pizzaPrices: true,
        addonGroups: { include: { addons: { where: { active: true }, orderBy: { price: "asc" } } } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.pizzaSize.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.crust.findMany({ where: { active: true }, include: { prices: true }, orderBy: { name: "asc" } }),
  ]);

  const catalogProducts: CatalogProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    imageUrl: p.imageUrl,
    kind: p.kind,
    basePrice: p.basePrice,
    paused: p.paused,
    featured: p.featured,
    tags: p.tags ? p.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    categoryId: p.categoryId,
    categoryName: p.category.name,
    categorySlug: p.category.slug,
    sector: p.category.sector,
    variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
    pizzaPrices: p.pizzaPrices.map((pp) => ({ sizeId: pp.sizeId, price: pp.price })),
    addonGroups: p.addonGroups.map((g) => ({
      id: g.id,
      name: g.name,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      addons: g.addons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
    })),
  }));

  const pizza: PizzaCatalog = {
    sizes: sizes.map((s) => ({ id: s.id, name: s.name, slices: s.slices, maxFlavors: s.maxFlavors })),
    crusts: crusts.map((c) => ({ id: c.id, name: c.name, prices: c.prices.map((cp) => ({ sizeId: cp.sizeId, price: cp.price })) })),
  };

  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, sector: c.sector })),
    products: catalogProducts,
    pizza,
  };
}

export async function getSettings() {
  return (await db.settings.findUnique({ where: { id: 1 } })) ?? (await db.settings.create({ data: { id: 1 } }));
}

export async function getHours() {
  return db.businessHour.findMany({ orderBy: [{ sector: "asc" }, { weekday: "asc" }, { opensAt: "asc" }] });
}
