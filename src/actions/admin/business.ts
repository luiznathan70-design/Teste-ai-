"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/auth";
import { onlyDigits } from "@/lib/utils";
import { DAILY_SECTIONS, SECTORS } from "@/lib/constants";
import { bool, date, fail, int, money, ok, optInt, optStr, str, type AdminFormState } from "./helpers";

function refresh() {
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------------ Cardápio do dia
export async function saveDailyMenu(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const menuDate = str(fd, "date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(menuDate)) return fail("Data inválida.");
  const pricePerKg = money(fd, "pricePerKg");
  if (Number.isNaN(pricePerKg)) return fail("Informe o preço do quilo.");

  // Cada seção vem de um textarea: um item por linha
  const items = DAILY_SECTIONS.flatMap((section) =>
    str(fd, `section_${section}`)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((name) => ({ section, name })),
  ).map((item, i) => ({ ...item, sortOrder: i }));

  await db.$transaction(async (tx) => {
    const menu = await tx.dailyMenu.upsert({
      where: { date: menuDate },
      create: { date: menuDate, pricePerKg, notes: str(fd, "notes") },
      update: { pricePerKg, notes: str(fd, "notes") },
    });
    await tx.dailyMenuItem.deleteMany({ where: { menuId: menu.id } });
    await tx.dailyMenuItem.createMany({ data: items.map((i) => ({ ...i, menuId: menu.id })) });
  });
  refresh();
  return ok("Cardápio do dia publicado.");
}

// ------------------------------------------------------------------ Bairros
export async function saveNeighborhood(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const name = str(fd, "name");
  const fee = money(fd, "fee");
  if (!name) return fail("Informe o bairro.");
  if (Number.isNaN(fee)) return fail("Taxa inválida.");
  const dup = await db.neighborhood.findUnique({ where: { name } });
  if (dup && dup.id !== id) return fail("Já existe um bairro com esse nome.");
  const data = { name, fee, active: bool(fd, "active") };
  if (id) await db.neighborhood.update({ where: { id }, data });
  else await db.neighborhood.create({ data });
  refresh();
  return ok("Bairro salvo.");
}

export async function deleteNeighborhood(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  const used = await db.address.count({ where: { neighborhoodId: id } });
  if (used) await db.neighborhood.update({ where: { id }, data: { active: false } });
  else await db.neighborhood.delete({ where: { id } });
  refresh();
}

// ------------------------------------------------------------------ Horários
export async function saveHours(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const rows: { sector: string; weekday: number; opensAt: string; closesAt: string }[] = [];
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  for (const sector of SECTORS) {
    for (let d = 0; d < 7; d++) {
      for (const shift of [1, 2]) {
        const open = str(fd, `${sector}_${d}_${shift}_open`);
        const close = str(fd, `${sector}_${d}_${shift}_close`);
        if (!open && !close) continue;
        if (!time.test(open) || !time.test(close)) return fail(`Horário inválido em ${sector} (${d}). Use HH:MM.`);
        rows.push({ sector, weekday: d, opensAt: open, closesAt: close });
      }
    }
  }
  await db.$transaction([db.businessHour.deleteMany(), db.businessHour.createMany({ data: rows })]);
  refresh();
  return ok("Horários atualizados.");
}

// ------------------------------------------------------------------ Cupons
export async function saveCoupon(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const code = str(fd, "code").toUpperCase().replace(/\s/g, "");
  const type = str(fd, "type");
  if (!code) return fail("Informe o código.");
  if (type !== "PERCENT" && type !== "FIXED") return fail("Tipo inválido.");
  const value = type === "PERCENT" ? int(fd, "value") : money(fd, "value");
  if (!value || Number.isNaN(value) || value <= 0) return fail("Valor do desconto inválido.");
  if (type === "PERCENT" && value > 100) return fail("Percentual máximo é 100%.");
  const minOrder = str(fd, "minOrder") ? money(fd, "minOrder") : 0;
  if (Number.isNaN(minOrder)) return fail("Pedido mínimo inválido.");
  const dup = await db.coupon.findUnique({ where: { code } });
  if (dup && dup.id !== id) return fail("Já existe um cupom com esse código.");
  const data = { code, type, value, minOrder, maxUses: optInt(fd, "maxUses"), expiresAt: date(fd, "expiresAt"), active: bool(fd, "active") };
  if (id) await db.coupon.update({ where: { id }, data });
  else await db.coupon.create({ data });
  refresh();
  return ok("Cupom salvo.");
}

export async function deleteCoupon(fd: FormData) {
  await requireAdmin();
  await db.coupon.delete({ where: { id: int(fd, "id") } });
  refresh();
}

// ------------------------------------------------------------------ Promoções
export async function savePromotion(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const title = str(fd, "title");
  if (!title) return fail("Informe o título.");
  const startsAt = str(fd, "startsAt") ? new Date(`${str(fd, "startsAt")}T00:00:00-03:00`) : null;
  const data = {
    title,
    description: str(fd, "description"),
    imageUrl: optStr(fd, "imageUrl"),
    badge: optStr(fd, "badge"),
    link: optStr(fd, "link"),
    active: bool(fd, "active"),
    startsAt,
    endsAt: date(fd, "endsAt"),
    sortOrder: int(fd, "sortOrder"),
  };
  if (id) await db.promotion.update({ where: { id }, data });
  else await db.promotion.create({ data });
  refresh();
  return ok("Promoção salva.");
}

export async function deletePromotion(fd: FormData) {
  await requireAdmin();
  await db.promotion.delete({ where: { id: int(fd, "id") } });
  refresh();
}

// ------------------------------------------------------------------ Depoimentos
export async function saveTestimonial(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const name = str(fd, "name");
  const text = str(fd, "text");
  if (!name || !text) return fail("Informe nome e depoimento.");
  const data = { name, text, rating: Math.min(5, Math.max(1, int(fd, "rating", 5))), active: bool(fd, "active") };
  if (id) await db.testimonial.update({ where: { id }, data });
  else await db.testimonial.create({ data });
  refresh();
  return ok("Depoimento salvo.");
}

export async function deleteTestimonial(fd: FormData) {
  await requireAdmin();
  await db.testimonial.delete({ where: { id: int(fd, "id") } });
  refresh();
}

// ------------------------------------------------------------------ Configurações
export async function saveSettings(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) return fail("Informe o nome do restaurante.");
  const minOrder = str(fd, "minOrder") ? money(fd, "minOrder") : 0;
  if (Number.isNaN(minOrder)) return fail("Pedido mínimo inválido.");
  const data = {
    name,
    slogan: str(fd, "slogan"),
    logoUrl: optStr(fd, "logoUrl"),
    phone: str(fd, "phone"),
    whatsapp: onlyDigits(str(fd, "whatsapp")),
    email: optStr(fd, "email"),
    address: str(fd, "address"),
    city: str(fd, "city"),
    instagram: optStr(fd, "instagram")?.replace(/^@/, "") ?? null,
    pixKey: str(fd, "pixKey"),
    pixMerchant: str(fd, "pixMerchant").slice(0, 25),
    minOrder,
    prepTimeMin: int(fd, "prepTimeMin", 40),
    aboutText: str(fd, "aboutText"),
  };
  await db.settings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  refresh();
  return ok("Configurações salvas.");
}
