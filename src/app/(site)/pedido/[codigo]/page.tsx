import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/catalog";
import { buildPixPayload } from "@/lib/pix";
import { orderWhatsappMessage, safeDetails, whatsappLink } from "@/lib/whatsapp";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ORDER_TYPE_LABELS, PAYMENT_LABELS, type PaymentMethod } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { OrderTracker } from "@/components/order/order-tracker";
import { PixPayment } from "@/components/checkout/pix-payment";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "Acompanhe seu pedido" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ codigo: string }>; searchParams: Promise<{ novo?: string }> }) {
  const { codigo } = await params;
  const { novo } = await searchParams;
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { code: codigo.toUpperCase() },
      include: { items: true, history: { orderBy: { createdAt: "asc" } } },
    }),
    getSettings(),
  ]);
  if (!order) notFound();

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const trackingUrl = `${origin}/pedido/${order.code}`;
  const message = orderWhatsappMessage(order, trackingUrl);

  // Pix "copia e cola" com o valor exato e o código do pedido como identificador
  let pix: { payload: string; qr: string } | null = null;
  if (order.paymentMethod === "PIX" && !order.paid && order.status !== "CANCELADO" && settings.pixKey) {
    const payload = buildPixPayload({
      key: settings.pixKey,
      merchantName: settings.pixMerchant || settings.name,
      merchantCity: settings.city.startsWith("[") ? "BRASIL" : settings.city,
      amountCents: order.total,
      txid: order.code,
    });
    pix = { payload, qr: await QRCode.toDataURL(payload, { margin: 1, width: 280 }) };
  }

  return (
    <div className="container-page max-w-3xl py-8">
      {novo && (
        <div className="mb-6 rounded-2xl bg-emerald-600 p-5 text-white shadow-card">
          <p className="font-display text-2xl">Pedido recebido! 🎉</p>
          <p className="mt-1 text-emerald-50">Guarde o código <strong>{order.code}</strong>. Esta página atualiza sozinha.</p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-madeira-500">Pedido</p>
          <h1 className="text-3xl text-madeira-800">#{order.code}</h1>
        </div>
        <p className="text-sm text-madeira-500">Feito em {formatDateTime(order.createdAt)}</p>
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <OrderTracker
          code={order.code}
          type={order.type}
          initial={{ status: order.status, paid: order.paid, history: order.history.map((h) => ({ status: h.status, createdAt: h.createdAt.toISOString() })) }}
          prepTimeMin={settings.prepTimeMin}
        />
      </Card>

      {pix && (
        <Card className="mt-6 p-5 sm:p-6">
          <PixPayment payload={pix.payload} qrDataUrl={pix.qr} pixKey={settings.pixKey} total={order.total} />
        </Card>
      )}

      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="mb-3 text-xl text-madeira-800">Resumo</h2>
        <ul className="divide-y divide-madeira-100 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <span>
                <strong>{i.quantity}x</strong> {i.name}
                {safeDetails(i.details).length > 0 && <span className="block text-xs text-madeira-500">{safeDetails(i.details).join(" · ")}</span>}
                {i.notes && <span className="block text-xs text-madeira-400 italic">Obs.: {i.notes}</span>}
              </span>
              <span className="font-semibold whitespace-nowrap">{formatMoney(i.totalPrice)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-madeira-100 pt-3 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(order.subtotal)}</dd></div>
          {order.deliveryFee > 0 && <div className="flex justify-between"><dt>Taxa de entrega</dt><dd>{formatMoney(order.deliveryFee)}</dd></div>}
          {order.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Desconto {order.couponCode && `(${order.couponCode})`}</dt><dd>- {formatMoney(order.discount)}</dd></div>}
          <div className="flex justify-between text-lg font-extrabold"><dt>Total</dt><dd>{formatMoney(order.total)}</dd></div>
        </dl>
        <div className="mt-4 grid gap-2 rounded-xl bg-creme-100 p-3 text-sm text-madeira-700 sm:grid-cols-2">
          <p><strong>{ORDER_TYPE_LABELS[order.type]}</strong>{order.type === "DELIVERY" && `: ${order.street}, ${order.number}${order.complement ? ` (${order.complement})` : ""} — ${order.neighborhoodName}`}</p>
          <p>
            <strong>Pagamento:</strong> {PAYMENT_LABELS[order.paymentMethod as PaymentMethod]}
            {order.changeFor ? ` (troco para ${formatMoney(order.changeFor)})` : ""}
          </p>
        </div>
      </Card>

      <a href={whatsappLink(settings.whatsapp, message)} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "lg", "mt-6 w-full bg-[#25D366] hover:bg-[#1ebe5b]")}>
        <WhatsAppIcon className="h-5 w-5" /> Enviar resumo pelo WhatsApp
      </a>
    </div>
  );
}
