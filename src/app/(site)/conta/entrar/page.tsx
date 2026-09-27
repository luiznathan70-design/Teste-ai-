import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="container-page max-w-md py-12">
      <Card className="p-6 sm:p-8">
        <h1 className="text-3xl text-madeira-800">Entrar</h1>
        <p className="mt-1 mb-6 text-sm text-madeira-500">Acesse seus pedidos e endereços salvos.</p>
        <LoginForm callbackUrl={callbackUrl} />
      </Card>
    </div>
  );
}
