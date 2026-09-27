import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Criar conta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="container-page max-w-md py-12">
      <Card className="p-6 sm:p-8">
        <h1 className="text-3xl text-madeira-800">Criar conta</h1>
        <p className="mt-1 mb-6 text-sm text-madeira-500">Salve seus endereços e acompanhe o histórico de pedidos.</p>
        <RegisterForm callbackUrl={callbackUrl} />
      </Card>
    </div>
  );
}
