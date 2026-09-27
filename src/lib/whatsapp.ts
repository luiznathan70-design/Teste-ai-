import { formatMoney } from "./format";
import { ORDER_TYPE_LABELS, PAYMENT_LABELS, type PaymentMethod } from "./constants";

export function whatsappLink(phoneDigits: string, text?: string) {
  const base = `https://wa.me/${phoneDigits.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

type OrderForMessage = {
  code: string;
  customerName: string;
  customerPhone: string;
  type: string;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhoodName?: string | null;
  reference?: string | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  changeFor?: number | null;
  notes?: string | null;
  items: { name: string; quantity: number; totalPrice: number; details: string; notes?: string | null }[];
};

/** Monta o resumo do pedido em texto para envio pelo WhatsApp */
export function orderWhatsappMessage(order: OrderForMessage, trackingUrl?: string) {
  const lines: string[] = [];
  lines.push(`*Pedido ${order.code} — Ranchos Pizzaria*`);
  lines.push("");
  for (const item of order.items) {
    lines.push(`${item.quantity}x ${item.name} — ${formatMoney(item.totalPrice)}`);
    for (const d of safeDetails(item.details)) lines.push(`   • ${d}`);
    if (item.notes) lines.push(`   Obs.: ${item.notes}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${formatMoney(order.subtotal)}`);
  if (order.deliveryFee) lines.push(`Taxa de entrega: ${formatMoney(order.deliveryFee)}`);
  if (order.discount) lines.push(`Desconto: -${formatMoney(order.discount)}`);
  lines.push(`*Total: ${formatMoney(order.total)}*`);
  lines.push("");
  lines.push(`${ORDER_TYPE_LABELS[order.type] ?? order.type}`);
  if (order.type === "DELIVERY") {
    const addr = [order.street, order.number].filter(Boolean).join(", ");
    lines.push(`Endereço: ${addr}${order.complement ? ` (${order.complement})` : ""} — ${order.neighborhoodName ?? ""}`);
    if (order.reference) lines.push(`Referência: ${order.reference}`);
  }
  lines.push(`Pagamento: ${PAYMENT_LABELS[order.paymentMethod as PaymentMethod] ?? order.paymentMethod}`);
  if (order.paymentMethod === "CASH" && order.changeFor) lines.push(`Troco para: ${formatMoney(order.changeFor)}`);
  if (order.notes) lines.push(`Observações: ${order.notes}`);
  lines.push("");
  lines.push(`Cliente: ${order.customerName} — ${order.customerPhone}`);
  if (trackingUrl) lines.push(`Acompanhe: ${trackingUrl}`);
  return lines.join("\n");
}

export function safeDetails(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
