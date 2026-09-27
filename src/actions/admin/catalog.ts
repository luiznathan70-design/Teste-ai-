"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/auth";
import { slugify } from "@/lib/utils";
import { PRODUCT_KINDS, SECTORS } from "@/lib/constants";
import { bool, fail, int, money, ok, optStr, str, type AdminFormState } from "./helpers";

function refresh() {
  revalidatePath("/", "layout");
}

/** Garante slug único adicionando sufixo numérico */
async function uniqueSlug(base: string, table: "product" | "category", ignoreId?: number) {
  let slug = slugify(base) || "item";
  for (let i = 2; ; i++) {
    const found =
      table === "product"
        ? await db.product.findUnique({ where: { slug }, select: { id: true } })
        : await db.category.findUnique({ where: { slug }, select: { id: true } });
    if (!found || found.id === ignoreId) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

// ------------------------------------------------------------------ Categorias
export async function saveCategory(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const name = str(fd, "name");
  const sector = str(fd, "sector");
  if (!name) return fail("Informe o nome.");
  if (!SECTORS.includes(sector as never)) return fail("Setor inválido.");
  const data = { name, sector, sortOrder: int(fd, "sortOrder"), active: bool(fd, "active"), slug: await uniqueSlug(name, "category", id || undefined) };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  refresh();
  return ok("Categoria salva.");
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) {
    // Com produtos vinculados apenas desativa, para não perder histórico
    await db.category.update({ where: { id }, data: { active: false } });
  } else {
    await db.category.delete({ where: { id } });
  }
  refresh();
}

// ------------------------------------------------------------------ Produtos
export async function saveProduct(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const name = str(fd, "name");
  const kind = str(fd, "kind");
  const categoryId = int(fd, "categoryId");
  if (!name) return fail("Informe o nome do produto.");
  if (!PRODUCT_KINDS.includes(kind as never)) return fail("Tipo inválido.");
  if (!categoryId) return fail("Escolha a categoria.");

  const basePrice = kind === "SIMPLE" ? money(fd, "basePrice") : 0;
  if (Number.isNaN(basePrice)) return fail("Preço inválido.");

  // Preços por tamanho (pizza): campos "size_<id>"
  const sizes = await db.pizzaSize.findMany();
  const pizzaPrices: { sizeId: number; price: number }[] = [];
  if (kind === "PIZZA") {
    for (const s of sizes) {
      if (str(fd, `size_${s.id}`) === "") continue;
      const price = money(fd, `size_${s.id}`);
      if (Number.isNaN(price)) return fail(`Preço inválido para ${s.name}.`);
      pizzaPrices.push({ sizeId: s.id, price });
    }
    if (!pizzaPrices.length) return fail("Informe o preço de pelo menos um tamanho.");
  }

  // Variações: linhas "variant_name[]" + "variant_price[]"
  const variants: { name: string; price: number; sortOrder: number }[] = [];
  if (kind === "VARIANT") {
    const names = fd.getAll("variant_name").map(String);
    const prices = fd.getAll("variant_price").map(String);
    names.forEach((n, i) => {
      if (!n.trim()) return;
      const fdi = new FormData();
      fdi.set("p", prices[i] ?? "");
      variants.push({ name: n.trim(), price: money(fdi, "p"), sortOrder: i });
    });
    if (!variants.length) return fail("Cadastre pelo menos uma variação.");
    if (variants.some((v) => Number.isNaN(v.price))) return fail("Preço de variação inválido.");
  }

  const addonGroupIds = fd.getAll("addonGroupIds").map(Number).filter(Boolean);

  const data = {
    name,
    slug: await uniqueSlug(name, "product", id || undefined),
    description: str(fd, "description"),
    imageUrl: optStr(fd, "imageUrl"),
    kind,
    basePrice,
    categoryId,
    paused: bool(fd, "paused"),
    featured: bool(fd, "featured"),
    tags: str(fd, "tags"),
    sortOrder: int(fd, "sortOrder"),
  };

  const productId = await db.$transaction(async (tx) => {
    const product = id
      ? await tx.product.update({ where: { id }, data: { ...data, addonGroups: { set: addonGroupIds.map((g) => ({ id: g })) } } })
      : await tx.product.create({ data: { ...data, addonGroups: { connect: addonGroupIds.map((g) => ({ id: g })) } } });
    await tx.pizzaPrice.deleteMany({ where: { productId: product.id } });
    await tx.productVariant.deleteMany({ where: { productId: product.id } });
    if (pizzaPrices.length) await tx.pizzaPrice.createMany({ data: pizzaPrices.map((p) => ({ ...p, productId: product.id })) });
    if (variants.length) await tx.productVariant.createMany({ data: variants.map((v) => ({ ...v, productId: product.id })) });
    return product.id;
  });

  refresh();
  if (!id) redirect(`/admin/produtos/${productId}?salvo=1`);
  return ok("Produto salvo.");
}

export async function toggleProductPaused(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  const p = await db.product.findUnique({ where: { id } });
  if (p) await db.product.update({ where: { id }, data: { paused: !p.paused } });
  refresh();
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  await db.product.delete({ where: { id: int(fd, "id") } });
  refresh();
  redirect("/admin/produtos");
}

// ------------------------------------------------------------------ Tamanhos de pizza
export async function saveSize(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const name = str(fd, "name");
  if (!name) return fail("Informe o nome do tamanho.");
  const maxFlavors = Math.min(3, Math.max(1, int(fd, "maxFlavors", 1)));
  const data = { name, slices: int(fd, "slices", 8), maxFlavors, sortOrder: int(fd, "sortOrder"), active: bool(fd, "active") };
  if (id) await db.pizzaSize.update({ where: { id }, data });
  else await db.pizzaSize.create({ data });
  refresh();
  return ok("Tamanho salvo.");
}

// ------------------------------------------------------------------ Bordas
export async function saveCrust(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const name = str(fd, "name");
  if (!name) return fail("Informe o nome da borda.");
  const sizes = await db.pizzaSize.findMany();
  const prices: { sizeId: number; price: number }[] = [];
  for (const s of sizes) {
    if (str(fd, `size_${s.id}`) === "") continue;
    const price = money(fd, `size_${s.id}`);
    if (Number.isNaN(price)) return fail(`Preço inválido para ${s.name}.`);
    prices.push({ sizeId: s.id, price });
  }
  await db.$transaction(async (tx) => {
    const crust = id
      ? await tx.crust.update({ where: { id }, data: { name, active: bool(fd, "active") } })
      : await tx.crust.create({ data: { name, active: bool(fd, "active") } });
    await tx.crustPrice.deleteMany({ where: { crustId: crust.id } });
    if (prices.length) await tx.crustPrice.createMany({ data: prices.map((p) => ({ ...p, crustId: crust.id })) });
  });
  refresh();
  return ok("Borda salva.");
}

export async function deleteCrust(fd: FormData) {
  await requireAdmin();
  await db.crust.delete({ where: { id: int(fd, "id") } });
  refresh();
}

// ------------------------------------------------------------------ Adicionais
export async function saveAddonGroup(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const name = str(fd, "name");
  if (!name) return fail("Informe o nome do grupo.");
  const data = { name, minSelect: int(fd, "minSelect"), maxSelect: int(fd, "maxSelect", 10) };
  if (data.maxSelect < data.minSelect) return fail("O máximo deve ser maior ou igual ao mínimo.");
  if (id) await db.addonGroup.update({ where: { id }, data });
  else await db.addonGroup.create({ data });
  refresh();
  return ok("Grupo salvo.");
}

export async function deleteAddonGroup(fd: FormData) {
  await requireAdmin();
  await db.addonGroup.delete({ where: { id: int(fd, "id") } });
  refresh();
}

export async function saveAddon(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const name = str(fd, "name");
  const price = money(fd, "price");
  if (!name) return fail("Informe o nome.");
  if (Number.isNaN(price)) return fail("Preço inválido.");
  const data = { name, price, active: bool(fd, "active"), groupId: int(fd, "groupId") };
  if (id) await db.addon.update({ where: { id }, data });
  else await db.addon.create({ data });
  refresh();
  return ok("Adicional salvo.");
}

export async function deleteAddon(fd: FormData) {
  await requireAdmin();
  await db.addon.delete({ where: { id: int(fd, "id") } });
  refresh();
}
