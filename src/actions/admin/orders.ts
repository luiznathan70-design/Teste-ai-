"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  await requireAdmin();
  if (!ORDER_STATUSES.includes(status)) throw new Error("Status inválido");
  await db.order.update({
    where: { id: orderId },
    data: {
      status,
      history: { create: { status } },
      // Entregue em dinheiro/cartão = pago
      ...(status === "ENTREGUE" ? { paid: true } : {}),
    },
  });
  revalidatePath("/admin/pedidos");
}

export async function setOrderPaid(orderId: number, paid: boolean) {
  await requireAdmin();
  await db.order.update({ where: { id: orderId }, data: { paid } });
  revalidatePath("/admin/pedidos");
}
