"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { buttonClasses } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { formatMoney } from "@/lib/format";
import { useCart, cartSubtotal } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";

/** Gaveta lateral do carrinho, aberta pelo botão do cabeçalho */
export function CartDrawer() {
  const hydrated = useHydrated();
  const { items, isOpen, close, setQuantity, remove } = useCart();
  if (!hydrated) return null;
  const subtotal = cartSubtotal(items);

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      side="right"
      title="Seu pedido"
      footer={
        items.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <p className="text-xs text-madeira-500">Taxa de entrega e cupons são calculados no próximo passo.</p>
            <Link href="/checkout" onClick={close} className={buttonClasses("primary", "lg", "w-full")}>
              Finalizar pedido
            </Link>
            <button onClick={close} className="w-full text-center text-sm font-semibold text-madeira-600 hover:underline">
              Continuar comprando
            </button>
          </div>
        )
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ShoppingBag className="h-12 w-12 text-madeira-200" />
          <p className="mt-4 font-semibold text-madeira-700">Seu carrinho está vazio</p>
          <p className="mt-1 text-sm text-madeira-500">Que tal uma pizza quentinha?</p>
          <Link href="/cardapio" onClick={close} className={buttonClasses("primary", "md", "mt-6")}>
            Ver cardápio
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-madeira-100">
          {items.map((item) => (
            <li key={item.key} className="flex gap-3 py-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <SafeImage src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-madeira-900">{item.name}</p>
                {item.details.map((d) => (
                  <p key={d} className="text-xs text-madeira-500">{d}</p>
                ))}
                {item.selection.notes && <p className="text-xs text-madeira-400 italic">Obs.: {item.selection.notes}</p>}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-madeira-200">
                    <button className="p-1.5" onClick={() => setQuantity(item.key, item.selection.quantity - 1)} aria-label="Diminuir">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold">{item.selection.quantity}</span>
                    <button className="p-1.5" onClick={() => setQuantity(item.key, Math.min(99, item.selection.quantity + 1))} aria-label="Aumentar">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brasa-700">{formatMoney(item.unitPrice * item.selection.quantity)}</span>
                    <button onClick={() => remove(item.key)} className="p-1 text-madeira-300 hover:text-brasa-600" aria-label="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
