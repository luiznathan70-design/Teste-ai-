"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Bell, BellOff, Bike, Check, ChevronRight, Printer, Store, X } from "lucide-react";
import { updateOrderStatus, setOrderPaid } from "@/actions/admin/orders";
import { ORDER_STATUS_LABELS, PAYMENT_LABELS, nextStatus, type OrderStatus, type PaymentMethod } from "@/lib/constants";
import { formatMoney, formatTime } from "@/lib/format";
import { safeDetails, whatsappLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type Order = {
  id: number;
  code: string;
  customerName: string;
  customerPhone: string;
  type: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhoodName: string | null;
  total: number;
  paymentMethod: string;
  changeFor: number | null;
  paid: boolean;
  status: string;
  notes: string | null;
  createdAt: string;
  items: { id: number; name: string; quantity: number; details: string; notes: string | null }[];
};

const COLUMNS: { key: string; title: string; statuses: string[]; tone: string }[] = [
  { key: "novo", title: "Recebidos", statuses: ["RECEBIDO"], tone: "border-t-brasa-600" },
  { key: "preparo", title: "Em preparo", statuses: ["EM_PREPARO"], tone: "border-t-milho-500" },
  { key: "pronto", title: "Saiu / Pronto", statuses: ["SAIU_PARA_ENTREGA", "PRONTO_RETIRADA"], tone: "border-t-sky-500" },
  { key: "fim", title: "Finalizados hoje", statuses: ["ENTREGUE", "CANCELADO"], tone: "border-t-emerald-600" },
];

/** Toca um "plim-plim" usando Web Audio (não precisa de arquivo de som) */
function playChime() {
  try {
    const ctx = new AudioContext();
    [880, 1320, 880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  } catch {
    /* navegador sem suporte */
  }
}

export function KanbanBoard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [sound, setSound] = useState(false);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const known = useRef<Set<number> | null>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pedidos", { cache: "no-store" });
      if (!res.ok) return;
      const data: Order[] = await res.json();
      // Detecta pedidos novos desde a última consulta
      if (known.current) {
        const fresh = data.filter((o) => !known.current!.has(o.id) && o.status === "RECEBIDO");
        if (fresh.length) {
          if (soundRef.current) playChime();
          setNewIds((cur) => new Set([...cur, ...fresh.map((o) => o.id)]));
          document.title = `(${fresh.length}) Novo pedido! — Painel`;
        }
      }
      known.current = new Set(data.map((o) => o.id));
      setOrders(data);
    } catch {
      /* tenta de novo no próximo ciclo */
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, 5000);
    const onFocus = () => (document.title = "Pedidos — Painel");
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  function act(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
      await load();
    });
  }

  if (!orders) return <p className="py-20 text-center text-madeira-400">Carregando pedidos...</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          variant={sound ? "primary" : "outline"}
          onClick={() => {
            setSound((s) => !s);
            if (!sound) playChime(); // o navegador só libera áudio após um clique
          }}
        >
          {sound ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          {sound ? "Som ativado" : "Ativar som de novo pedido"}
        </Button>
        <span className="text-sm text-madeira-500">
          {orders.filter((o) => !["ENTREGUE", "CANCELADO"].includes(o.status)).length} pedidos em andamento
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => col.statuses.includes(o.status));
          if (col.key === "fim") list.reverse();
          return (
            <section key={col.key} className={cn("rounded-2xl border-t-4 bg-madeira-50/60 p-3", col.tone)}>
              <h2 className="mb-3 flex items-center justify-between font-sans text-sm font-bold tracking-normal text-madeira-700 uppercase">
                {col.title}
                <span className="rounded-full bg-white px-2 py-0.5 text-xs">{list.length}</span>
              </h2>
              <div className="space-y-3">
                {list.length === 0 && <p className="py-6 text-center text-xs text-madeira-400">Nenhum pedido</p>}
                {list.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    isNew={newIds.has(o.id)}
                    busy={pending}
                    onSeen={() => setNewIds((cur) => { const n = new Set(cur); n.delete(o.id); return n; })}
                    onAdvance={(s) => act(() => updateOrderStatus(o.id, s))}
                    onCancel={() => confirm(`Cancelar o pedido ${o.code}?`) && act(() => updateOrderStatus(o.id, "CANCELADO"))}
                    onPaid={() => act(() => setOrderPaid(o.id, !o.paid))}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({
  order: o,
  isNew,
  busy,
  onSeen,
  onAdvance,
  onCancel,
  onPaid,
}: {
  order: Order;
  isNew: boolean;
  busy: boolean;
  onSeen: () => void;
  onAdvance: (s: OrderStatus) => void;
  onCancel: () => void;
  onPaid: () => void;
}) {
  const next = nextStatus(o.type, o.status);
  const finished = o.status === "ENTREGUE" || o.status === "CANCELADO";
  return (
    <article
      onMouseEnter={isNew ? onSeen : undefined}
      className={cn("rounded-xl bg-white p-3 text-sm shadow-card", isNew && "ring-2 ring-brasa-500 animate-pulse", finished && "opacity-70")}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-madeira-900">#{o.code}</p>
          <p className="text-xs text-madeira-500">{formatTime(o.createdAt)} · {o.customerName}</p>
        </div>
        <Badge tone={o.type === "DELIVERY" ? "blue" : "neutral"}>
          {o.type === "DELIVERY" ? <Bike className="h-3 w-3" /> : <Store className="h-3 w-3" />}
          {o.type === "DELIVERY" ? "Entrega" : "Retirada"}
        </Badge>
      </header>

      <ul className="mt-2 space-y-1 border-y border-dashed border-madeira-100 py-2">
        {o.items.map((i) => (
          <li key={i.id}>
            <strong>{i.quantity}x</strong> {i.name}
            {safeDetails(i.details).length > 0 && <span className="block text-xs text-madeira-500">{safeDetails(i.details).join(" · ")}</span>}
            {i.notes && <span className="block text-xs font-semibold text-brasa-700">Obs.: {i.notes}</span>}
          </li>
        ))}
      </ul>
      {o.notes && <p className="mt-2 rounded bg-milho-300/40 px-2 py-1 text-xs">📝 {o.notes}</p>}
      {o.type === "DELIVERY" && (
        <p className="mt-2 text-xs text-madeira-600">
          📍 {o.street}, {o.number}{o.complement ? ` (${o.complement})` : ""} — {o.neighborhoodName}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
        <span className="font-extrabold">{formatMoney(o.total)}</span>
        <button onClick={onPaid} disabled={busy || o.status === "CANCELADO"} title="Alternar pagamento">
          <Badge tone={o.paid ? "green" : "yellow"}>
            {PAYMENT_LABELS[o.paymentMethod as PaymentMethod]} · {o.paid ? "pago" : "a receber"}
          </Badge>
        </button>
      </div>
      {o.changeFor && <p className="text-xs text-madeira-500">Troco para {formatMoney(o.changeFor)} ({formatMoney(o.changeFor - o.total)})</p>}

      <footer className="mt-3 flex flex-wrap items-center gap-1.5">
        {next && (
          <Button size="sm" className="w-full whitespace-nowrap" disabled={busy} onClick={() => onAdvance(next)}>
            {next === "ENTREGUE" ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {ORDER_STATUS_LABELS[next]}
          </Button>
        )}
        {finished && <Badge tone={o.status === "ENTREGUE" ? "green" : "red"}>{ORDER_STATUS_LABELS[o.status as OrderStatus]}</Badge>}
        <a href={`/admin/comanda/${o.id}`} target="_blank" className="rounded-lg border border-madeira-200 p-1.5 text-madeira-600 hover:bg-creme-100" title="Imprimir comanda">
          <Printer className="h-4 w-4" />
        </a>
        <a href={whatsappLink(`55${o.customerPhone.replace(/\D/g, "")}`, `Olá, ${o.customerName}! Sobre seu pedido #${o.code} na Ranchos Pizzaria:`)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-madeira-200 p-1.5 text-[#25D366] hover:bg-creme-100" title="WhatsApp do cliente">
          <WhatsAppIcon className="h-4 w-4" />
        </a>
        {!finished && (
          <button onClick={onCancel} disabled={busy} className="rounded-lg border border-madeira-200 p-1.5 text-brasa-600 hover:bg-brasa-50" title="Cancelar pedido">
            <X className="h-4 w-4" />
          </button>
        )}
      </footer>
    </article>
  );
}
