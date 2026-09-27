"use client";

import { useEffect, useState } from "react";
import { Bike, CheckCircle2, ChefHat, ClipboardCheck, PackageCheck, XCircle } from "lucide-react";
import { ORDER_STATUS_LABELS, statusFlow, type OrderStatus } from "@/lib/constants";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type State = { status: string; paid: boolean; history: { status: string; createdAt: string }[] };

const ICONS: Record<string, React.ElementType> = {
  RECEBIDO: ClipboardCheck,
  EM_PREPARO: ChefHat,
  SAIU_PARA_ENTREGA: Bike,
  PRONTO_RETIRADA: PackageCheck,
  ENTREGUE: CheckCircle2,
};

/** Linha do tempo do pedido, atualizada automaticamente a cada 10 segundos */
export function OrderTracker({ code, type, initial, prepTimeMin }: { code: string; type: string; initial: State; prepTimeMin: number }) {
  const [state, setState] = useState(initial);

  useEffect(() => {
    if (state.status === "ENTREGUE" || state.status === "CANCELADO") return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedidos/${code}`, { cache: "no-store" });
        if (res.ok) setState(await res.json());
      } catch {
        /* sem conexão: tenta de novo no próximo ciclo */
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [code, state.status]);

  if (state.status === "CANCELADO") {
    return (
      <div className="flex items-center gap-3 text-brasa-700">
        <XCircle className="h-8 w-8" />
        <div>
          <p className="text-lg font-bold">Pedido cancelado</p>
          <p className="text-sm text-madeira-500">Em caso de dúvida, fale com a gente pelo WhatsApp.</p>
        </div>
      </div>
    );
  }

  const flow = statusFlow(type);
  const currentIndex = flow.indexOf(state.status as OrderStatus);
  const timeOf = (s: string) => state.history.filter((h) => h.status === s).at(-1)?.createdAt;

  return (
    <div>
      <p className="text-sm text-madeira-500">Status atual</p>
      <p className="font-display text-2xl text-brasa-700">{ORDER_STATUS_LABELS[state.status as OrderStatus]}</p>
      {currentIndex < flow.length - 1 && <p className="text-sm text-madeira-500">Tempo estimado: até {prepTimeMin} minutos</p>}

      <ol className="mt-6 grid gap-4 sm:grid-cols-4 sm:gap-2">
        {flow.map((s, i) => {
          const Icon = ICONS[s];
          const done = i <= currentIndex;
          const current = i === currentIndex;
          const time = timeOf(s);
          return (
            <li key={s} className="flex items-center gap-3 sm:flex-col sm:text-center">
              <span
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition",
                  done ? "border-brasa-600 bg-brasa-600 text-white" : "border-madeira-200 bg-white text-madeira-300",
                  current && "ring-4 ring-brasa-100 animate-pulse",
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span>
                <span className={cn("block text-sm font-bold", done ? "text-madeira-900" : "text-madeira-300")}>{ORDER_STATUS_LABELS[s]}</span>
                {time && done && <span className="text-xs text-madeira-500">{formatTime(time)}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {state.paid && <p className="mt-4 text-sm font-semibold text-emerald-700">✓ Pagamento confirmado</p>}
    </div>
  );
}
