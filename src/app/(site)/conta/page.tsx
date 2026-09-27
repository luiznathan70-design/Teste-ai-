import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { deleteAddressAction, logoutAction } from "@/actions/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/account/address-form";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/conta/entrar?callbackUrl=/conta");
  const userId = Number(session.user.id);
  const [user, neighborhoods] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        addresses: { include: { neighborhood: true } },
        orders: { orderBy: { createdAt: "desc" }, take: 30, include: { items: { select: { quantity: true, name: true } } } },
      },
    }),
    db.neighborhood.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!user) redirect("/conta/entrar");

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-madeira-800">Olá, {user.name.split(" ")[0]}!</h1>
          <p className="text-sm text-madeira-500">{user.email} · {user.phone}</p>
        </div>
        <div className="flex gap-2">
          {user.role === "ADMIN" && <Link href="/admin" className="rounded-xl bg-madeira-700 px-4 py-2 text-sm font-semibold text-creme-100">Painel</Link>}
          <form action={logoutAction}>
            <Button type="submit" variant="outline">Sair</Button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <h2 className="mb-4 text-xl text-madeira-800">Meus pedidos</h2>
          {user.orders.length === 0 ? (
            <p className="text-madeira-500">Você ainda não fez pedidos. <Link href="/cardapio" className="font-bold text-brasa-700 underline">Ver cardápio</Link></p>
          ) : (
            <ul className="divide-y divide-madeira-100">
              {user.orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/pedido/${o.code}`} className="flex items-center justify-between gap-3 py-3 hover:bg-creme-50">
                    <div className="min-w-0">
                      <p className="font-bold">#{o.code} <span className="font-normal text-madeira-500">· {formatDateTime(o.createdAt)}</span></p>
                      <p className="truncate text-sm text-madeira-500">{o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatMoney(o.total)}</p>
                      <Badge tone={o.status === "ENTREGUE" ? "green" : o.status === "CANCELADO" ? "neutral" : "yellow"}>
                        {ORDER_STATUS_LABELS[o.status as OrderStatus]}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-xl text-madeira-800">Endereços</h2>
          <ul className="space-y-2">
            {user.addresses.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 rounded-xl bg-creme-100 p-3 text-sm">
                <span className="flex gap-2">
                  <MapPin className="h-4 w-4 shrink-0 translate-y-0.5 text-brasa-600" />
                  <span>
                    <strong>{a.label}</strong>
                    <br />
                    {a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ""}
                    <br />
                    {a.neighborhood.name}
                  </span>
                </span>
                <form action={deleteAddressAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="p-1 text-madeira-300 hover:text-brasa-600" aria-label="Excluir endereço"><Trash2 className="h-4 w-4" /></button>
                </form>
              </li>
            ))}
          </ul>
          <AddressForm neighborhoods={neighborhoods.map((n) => ({ id: n.id, name: n.name }))} />
        </Card>
      </div>
    </div>
  );
}
