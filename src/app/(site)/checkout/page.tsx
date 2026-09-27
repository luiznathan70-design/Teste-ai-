import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getSettings } from "@/lib/catalog";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Finalizar pedido" };

export default async function CheckoutPage() {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const [settings, neighborhoods, user] = await Promise.all([
    getSettings(),
    db.neighborhood.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    userId ? db.user.findUnique({ where: { id: userId }, include: { addresses: true } }) : null,
  ]);

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl text-madeira-800">Finalizar pedido</h1>
      <CheckoutForm
        minOrder={settings.minOrder}
        prepTimeMin={settings.prepTimeMin}
        neighborhoods={neighborhoods.map((n) => ({ id: n.id, name: n.name, fee: n.fee }))}
        user={
          user
            ? {
                name: user.name,
                phone: user.phone ?? "",
                addresses: user.addresses.map((a) => ({
                  id: a.id,
                  label: a.label,
                  street: a.street,
                  number: a.number,
                  complement: a.complement ?? "",
                  reference: a.reference ?? "",
                  neighborhoodId: a.neighborhoodId,
                })),
              }
            : null
        }
      />
    </div>
  );
}
