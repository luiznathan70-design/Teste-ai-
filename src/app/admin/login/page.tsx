import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/account/auth-forms";
import { Logo } from "@/components/site/logo";

export const metadata: Metadata = { title: "Login do painel", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-wood p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex justify-center"><Logo dark /></div>
        <h1 className="text-center text-2xl text-madeira-800">Painel administrativo</h1>
        <p className="mt-1 mb-6 text-center text-sm text-madeira-500">Entre com seu usuário de administrador.</p>
        <LoginForm admin callbackUrl={callbackUrl ?? "/admin"} />
      </Card>
    </div>
  );
}
