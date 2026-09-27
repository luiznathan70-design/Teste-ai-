import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Status do pedido para a página de acompanhamento (consultado a cada 10s)
export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const order = await db.order.findUnique({
    where: { code: codigo.toUpperCase() },
    select: { status: true, paid: true, updatedAt: true, history: { select: { status: true, createdAt: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}
