import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { nowInBrazil } from "@/lib/hours";

/**
 * Pedidos do kanban: todos os ativos + entregues/cancelados de hoje.
 * O painel consulta esta rota a cada 5 segundos (polling).
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const startOfDay = new Date(`${nowInBrazil().isoDate}T00:00:00-03:00`);
  const orders = await db.order.findMany({
    where: {
      OR: [{ status: { notIn: ["ENTREGUE", "CANCELADO"] } }, { createdAt: { gte: startOfDay } }],
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(
    orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString() })),
    { headers: { "Cache-Control": "no-store" } },
  );
}
