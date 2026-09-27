import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/catalog";
import { formatDateTime, formatMoney } from "@/lib/format";
import { safeDetails } from "@/lib/whatsapp";
import { ORDER_TYPE_LABELS, PAYMENT_LABELS, SECTOR_LABELS, type PaymentMethod, type Sector } from "@/lib/constants";
import { PrintOnLoad } from "./print-on-load";

/** Comanda para impressora térmica 80mm (abre a janela de impressão automaticamente) */
export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin/login");
  const { id } = await params;
  const [order, settings] = await Promise.all([
    db.order.findUnique({ where: { id: Number(id) }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  // Agrupa itens por setor para facilitar a separação na cozinha
  const sectors = [...new Set(order.items.map((i) => i.sector))];

  return (
    <div className="mx-auto max-w-[80mm] bg-white p-3 font-mono text-[12px] leading-tight text-black">
      <PrintOnLoad />
      <div className="text-center">
        <p className="text-base font-bold">{settings.name.toUpperCase()}</p>
        <p>{settings.phone}</p>
        <p className="my-2 border-y border-dashed border-black py-1 text-lg font-bold">PEDIDO #{order.code}</p>
        <p>{formatDateTime(order.createdAt)} · {ORDER_TYPE_LABELS[order.type].toUpperCase()}</p>
      </div>

      <div className="mt-2 border-b border-dashed border-black pb-2">
        <p><b>Cliente:</b> {order.customerName}</p>
        <p><b>Tel.:</b> {order.customerPhone}</p>
        {order.type === "DELIVERY" && (
          <>
            <p><b>End.:</b> {order.street}, {order.number} {order.complement}</p>
            <p><b>Bairro:</b> {order.neighborhoodName}</p>
            {order.reference && <p><b>Ref.:</b> {order.reference}</p>}
          </>
        )}
      </div>

      {sectors.map((sector) => (
        <div key={sector} className="mt-2 border-b border-dashed border-black pb-2">
          <p className="font-bold">» {SECTOR_LABELS[sector as Sector]?.toUpperCase() ?? sector}</p>
          {order.items.filter((i) => i.sector === sector).map((i) => (
            <div key={i.id} className="mt-1">
              <div className="flex justify-between gap-2">
                <span className="font-bold">{i.quantity}x {i.name}</span>
                <span>{formatMoney(i.totalPrice)}</span>
              </div>
              {safeDetails(i.details).map((d) => <p key={d} className="pl-3">- {d}</p>)}
              {i.notes && <p className="pl-3 font-bold">OBS: {i.notes}</p>}
            </div>
          ))}
        </div>
      ))}

      <div className="mt-2 space-y-0.5">
        <p className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></p>
        {order.deliveryFee > 0 && <p className="flex justify-between"><span>Entrega</span><span>{formatMoney(order.deliveryFee)}</span></p>}
        {order.discount > 0 && <p className="flex justify-between"><span>Desconto {order.couponCode}</span><span>-{formatMoney(order.discount)}</span></p>}
        <p className="flex justify-between text-base font-bold"><span>TOTAL</span><span>{formatMoney(order.total)}</span></p>
        <p>Pagamento: {PAYMENT_LABELS[order.paymentMethod as PaymentMethod]} {order.paid ? "(PAGO)" : "(A RECEBER)"}</p>
        {order.changeFor && <p>Troco para {formatMoney(order.changeFor)} → levar {formatMoney(order.changeFor - order.total)}</p>}
      </div>
      {order.notes && <p className="mt-2 border-t border-dashed border-black pt-2 font-bold">OBS: {order.notes}</p>}
      <p className="mt-4 text-center">Obrigado pela preferência!</p>
    </div>
  );
}
