"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal simples e acessível. No celular vira "bottom sheet" (sobe de baixo);
 * no desktop fica centralizado. side="right" abre como gaveta lateral.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  side = "center",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "center" | "right";
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-madeira-900/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col bg-creme-50 shadow-2xl",
          side === "right"
            ? "ml-auto h-dvh max-h-dvh max-w-md"
            : "mt-auto rounded-t-3xl sm:m-auto sm:max-w-lg sm:rounded-3xl",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-madeira-100 px-5 py-4">
          <div className="font-display text-xl text-madeira-800">{title}</div>
          <button onClick={onClose} className="rounded-full p-2 text-madeira-500 hover:bg-madeira-50" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-madeira-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
