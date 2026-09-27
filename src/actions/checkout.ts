"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getHours, getSettings, loadCatalog } from "@/lib/catalog";
import { isSectorOpen } from "@/lib/hours";
import { couponDiscount, priceItem, PricingError, type PricedItem } from "@/lib/pricing";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/order";
import { formatMoney } from "@/lib/format";
import { SECTOR_LABELS, type Sector } from "@/lib/constants";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Busca e valida um cupom. Retorna o desconto calculado para o subtotal informado. */
async function findValidCoupon(code: string, subtotal: number) {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.active) return { error: "Cupom inválido." } as const;
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { error: "Este cupom expirou." } as const;
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) return { error: "Este cupom atingiu o limite de usos." } as const;
  if (subtotal < coupon.minOrder) return { error: `Cupom válido para pedidos a partir de ${formatMoney(coupon.minOrder)}.` } as const;
  return { coupon, discount: couponDiscount(coupon, subtotal) } as const;
}

/** Pré-visualização do cupom no checkout */
export async function checkCoupon(code: string, subtotal: number): Promise<Result<{ code: string; discount: number }>> {
  if (!code.trim()) return { ok: false, error: "Digite um cupom." };
  const res = await findValidCoupon(code, subtotal);
  if ("error" in res) return { ok: false, error: res.error! };
  return { ok: true, data: { code: res.coupon.code, discount: res.discount } };
}

/** Código público curto e fácil de ditar por telefone (sem 0/O/1/I) */
function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RP";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

/**
 * Cria o pedido. Todos os preços, taxas e descontos são recalculados aqui
 * a partir do banco — nada que vem do navegador é usado como valor.
 */
export async function placeOrder(input: CheckoutInput): Promise<Result<{ code: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;

  const [catalog, hours, settings, session] = await Promise.all([loadCatalog(), getHours(), getSettings(), auth()]);
  const products = new Map(catalog.products.map((p) => [p.id, p]));

  // 1. Itens
  let priced: PricedItem[];
  try {
    priced = data.items.map((sel) => priceItem(sel, products, catalog.pizza));
  } catch (e) {
    return { ok: false, error: e instanceof PricingError ? e.message : "Não foi possível calcular o pedido." };
  }
  for (const item of priced) {
    if (!isSectorOpen(item.sector, hours)) {
      return {
        ok: false,
        error: `${item.name}: ${SECTOR_LABELS[item.sector as Sector] ?? item.sector} está fechado agora. Remova o item para continuar.`,
      };
    }
  }
  const subtotal = priced.reduce((s, i) => s + i.totalPrice, 0);

  // 2. Entrega
  let deliveryFee = 0;
  let neighborhoodName: string | null = null;
  if (data.type === "DELIVERY") {
    const nb = await db.neighborhood.findFirst({ where: { id: data.neighborhoodId, active: true } });
    if (!nb) return { ok: false, error: "Não entregamos neste bairro. Escolha outro ou retire no local." };
    deliveryFee = nb.fee;
    neighborhoodName = nb.name;
    if (subtotal < settings.minOrder) {
      return { ok: false, error: `O pedido mínimo para entrega é ${formatMoney(settings.minOrder)}.` };
    }
  }

  // 3. Cupom
  let discount = 0;
  let couponId: number | null = null;
  let couponCode: string | null = null;
  if (data.couponCode) {
    const res = await findValidCoupon(data.couponCode, subtotal);
    if ("error" in res) return { ok: false, error: res.error! };
    discount = res.discount;
    couponId = res.coupon.id;
    couponCode = res.coupon.code;
  }

  const total = subtotal + deliveryFee - discount;

  // 4. Pagamento
  if (data.paymentMethod === "CASH" && data.changeFor && data.changeFor < total) {
    return { ok: false, error: `O valor para troco deve ser maior que o total (${formatMoney(total)}).` };
  }

  const userId = session?.user?.id ? Number(session.user.id) : null;

  // 5. Grava (transação: pedido + uso do cupom + endereço salvo)
  let code = generateCode();
  while (await db.order.findUnique({ where: { code } })) code = generateCode();

  await db.$transaction(async (tx) => {
    await tx.order.create({
      data: {
        code,
        userId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        type: data.type,
        street: data.type === "DELIVERY" ? data.street : null,
        number: data.type === "DELIVERY" ? data.number : null,
        complement: data.type === "DELIVERY" ? data.complement || null : null,
        reference: data.type === "DELIVERY" ? data.reference || null : null,
        neighborhoodName,
        subtotal,
        deliveryFee,
        discount,
        total,
        couponCode,
        paymentMethod: data.paymentMethod,
        changeFor: data.paymentMethod === "CASH" ? data.changeFor ?? null : null,
        notes: data.notes || null,
        items: {
          create: priced.map((i) => ({
            productId: i.productId,
            name: i.name,
            sector: i.sector,
            details: JSON.stringify(i.details),
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            notes: i.notes ?? null,
          })),
        },
        history: { create: { status: "RECEBIDO" } },
      },
    });
    if (couponId) await tx.coupon.update({ where: { id: couponId }, data: { uses: { increment: 1 } } });
    if (userId && data.saveAddress && data.type === "DELIVERY" && data.neighborhoodId) {
      const exists = await tx.address.findFirst({ where: { userId, street: data.street!, number: data.number! } });
      if (!exists) {
        await tx.address.create({
          data: {
            userId,
            street: data.street!,
            number: data.number!,
            complement: data.complement || null,
            reference: data.reference || null,
            neighborhoodId: data.neighborhoodId,
          },
        });
      }
    }
  });

  return { ok: true, data: { code } };
}
