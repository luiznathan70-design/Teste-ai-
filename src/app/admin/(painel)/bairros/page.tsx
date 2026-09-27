import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/catalog";
import { deleteNeighborhood, saveNeighborhood } from "@/actions/admin/business";
import { centsToInput, formatMoney } from "@/lib/format";
import { PageHeader, Table, Td } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { DeleteButton } from "@/components/admin/confirm-button";
import { Badge, Card } from "@/components/ui/card";
import { Checkbox, Field, Input } from "@/components/ui/form";

export default async function NeighborhoodsPage({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const [list, settings] = await Promise.all([db.neighborhood.findMany({ orderBy: { name: "asc" } }), getSettings()]);
  const editing = list.find((n) => n.id === Number(editar));
  return (
    <>
      <PageHeader title="Bairros e taxas de entrega" description={`Pedido mínimo para entrega: ${formatMoney(settings.minOrder)} (altere em Configurações).`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Table head={["Bairro", "Taxa", "Status", ""]}>
          {list.map((n) => (
            <tr key={n.id}>
              <Td className="font-semibold">{n.name}</Td>
              <Td>{formatMoney(n.fee)}</Td>
              <Td>{n.active ? <Badge tone="green">Entregamos</Badge> : <Badge>Inativo</Badge>}</Td>
              <Td className="text-right whitespace-nowrap">
                <Link href={`?editar=${n.id}`} className="mr-2 text-sm font-semibold underline">Editar</Link>
                <form action={deleteNeighborhood} className="inline">
                  <input type="hidden" name="id" value={n.id} />
                  <DeleteButton iconOnly />
                </form>
              </Td>
            </tr>
          ))}
        </Table>
        <Card className="p-5 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-4 text-lg text-madeira-800">{editing ? "Editar bairro" : "Novo bairro"}</h2>
          <AdminForm action={saveNeighborhood} resetOnSuccess={!editing} onSuccessHref={editing ? "/admin/bairros" : undefined} key={editing?.id ?? "new"}>
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <Field label="Bairro"><Input name="name" required defaultValue={editing?.name} /></Field>
            <Field label="Taxa de entrega (R$)"><Input name="fee" inputMode="decimal" required defaultValue={centsToInput(editing?.fee)} placeholder="0,00" /></Field>
            <Checkbox name="active" label="Entregamos neste bairro" defaultChecked={editing?.active ?? true} />
          </AdminForm>
        </Card>
      </div>
    </>
  );
}
