"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Botão de exclusão com confirmação (usar dentro de <form action={...}>) */
export function DeleteButton({ label = "Excluir", message = "Tem certeza que deseja excluir?", iconOnly, className }: { label?: string; message?: string; iconOnly?: boolean; className?: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brasa-700 hover:bg-brasa-50", className)}
      aria-label={label}
      title={label}
    >
      <Trash2 className="h-4 w-4" />
      {!iconOnly && label}
    </button>
  );
}
