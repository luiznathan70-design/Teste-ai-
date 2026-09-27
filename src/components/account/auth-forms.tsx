"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, adminLoginAction, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

function ErrorBox({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return <p className="rounded-xl bg-brasa-50 p-3 text-sm font-medium text-brasa-800">{state.error}</p>;
}

export function LoginForm({ callbackUrl, admin }: { callbackUrl?: string; admin?: boolean }) {
  const [state, action, pending] = useActionState(admin ? adminLoginAction : loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <ErrorBox state={state} />
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label="E-mail">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Senha">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
      {!admin && (
        <p className="text-center text-sm text-madeira-600">
          Ainda não tem conta?{" "}
          <Link href={`/conta/cadastro${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-bold text-brasa-700 underline">
            Cadastre-se
          </Link>
        </p>
      )}
    </form>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(registerAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <ErrorBox state={state} />
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label="Nome completo">
        <Input name="name" required autoComplete="name" />
      </Field>
      <Field label="Telefone / WhatsApp">
        <Input name="phone" type="tel" required autoComplete="tel" placeholder="(00) 00000-0000" />
      </Field>
      <Field label="E-mail">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Senha" hint="Mínimo de 6 caracteres">
        <Input name="password" type="password" required minLength={6} autoComplete="new-password" />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>
      <p className="text-center text-sm text-madeira-600">
        Já tem conta? <Link href="/conta/entrar" className="font-bold text-brasa-700 underline">Entrar</Link>
      </p>
    </form>
  );
}
