"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { AdminFormState } from "@/actions/admin/helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Formulário padrão do painel: envia para uma Server Action, mostra
 * mensagem de sucesso/erro e (opcionalmente) limpa o formulário após salvar.
 */
export function AdminForm({
  action,
  children,
  submitLabel = "Salvar",
  resetOnSuccess,
  onSuccessHref,
  className,
}: {
  action: (prev: AdminFormState, fd: FormData) => Promise<AdminFormState>;
  children: React.ReactNode;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  onSuccessHref?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      if (resetOnSuccess) ref.current?.reset();
      if (onSuccessHref) router.push(onSuccessHref);
    }
  }, [state, resetOnSuccess, onSuccessHref, router]);

  return (
    <form ref={ref} action={formAction} className={cn("space-y-4", className)}>
      {children}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </Button>
        {state?.error && <p className="text-sm font-medium text-brasa-700">{state.error}</p>}
        {state?.success && <p className="text-sm font-medium text-emerald-700">✓ {state.success}</p>}
      </div>
    </form>
  );
}
