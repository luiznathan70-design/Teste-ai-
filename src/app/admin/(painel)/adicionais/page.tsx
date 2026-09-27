import Link from "next/link";
import { db } from "@/lib/db";
import { deleteAddon, deleteAddonGroup, saveAddon, saveAddonGroup } from "@/actions/admin/catalog";
import { centsToInput, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { DeleteButton } from "@/components/admin/confirm-button";
import { Badge, Card } from "@/components/ui/card";
import { Checkbox, Field, Input } from "@/components/ui/form";

export default async function AddonsPage({ searchParams }: { searchParams: Promise<{ grupo?: string; item?: string }> }) {
  const { grupo, item } = await searchParams;
  const groups = await db.addonGroup.findMany({
    include: { addons: { orderBy: { name: "asc" } }, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  const editingGroup = groups.find((g) => g.id === Number(grupo));
  const editingAddon = groups.flatMap((g) => g.addons).find((a) => a.id === Number(item));

  return (
    <>
      <PageHeader title="Adicionais" description="Grupos de adicionais (bacon, ovo, molhos...). Vincule os grupos aos produtos na tela de cada produto." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.id} className="p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg text-madeira-800">{g.name}</h2>
                  <p className="text-xs text-madeira-500">Mín. {g.minSelect} · Máx. {g.maxSelect} · usado em {g._count.products} produto(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`?grupo=${g.id}`} className="text-sm font-semibold underline">Editar grupo</Link>
                  <form action={deleteAddonGroup}>
                    <input type="hidden" name="id" value={g.id} />
                    <DeleteButton iconOnly message="Excluir o grupo e todos os seus adicionais?" />
                  </form>
                </div>
              </div>
              <ul className="divide-y divide-madeira-50 text-sm">
                {g.addons.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                    <span>{a.name} {!a.active && <Badge>Inativo</Badge>}</span>
                    <span className="flex items-center gap-3">
                      <strong>{formatMoney(a.price)}</strong>
                      <Link href={`?item=${a.id}`} className="text-xs underline">Editar</Link>
                      <form action={deleteAddon}>
                        <input type="hidden" name="id" value={a.id} />
                        <DeleteButton iconOnly />
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-brasa-700">+ Adicionar item neste grupo</summary>
                <div className="mt-3">
                  <AdminForm action={saveAddon} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_120px]">
                    <input type="hidden" name="groupId" value={g.id} />
                    <input type="hidden" name="active" value="on" />
                    <Input name="name" placeholder="Nome" required />
                    <Input name="price" placeholder="0,00" inputMode="decimal" required />
                  </AdminForm>
                </div>
              </details>
            </Card>
          ))}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {editingAddon ? (
            <Card className="p-5">
              <h2 className="mb-4 text-lg text-madeira-800">Editar adicional</h2>
              <AdminForm action={saveAddon} onSuccessHref="/admin/adicionais" key={editingAddon.id}>
                <input type="hidden" name="id" value={editingAddon.id} />
                <input type="hidden" name="groupId" value={editingAddon.groupId} />
                <Field label="Nome"><Input name="name" required defaultValue={editingAddon.name} /></Field>
                <Field label="Preço"><Input name="price" inputMode="decimal" required defaultValue={centsToInput(editingAddon.price)} /></Field>
                <Checkbox name="active" label="Ativo" defaultChecked={editingAddon.active} />
              </AdminForm>
            </Card>
          ) : (
            <Card className="p-5">
              <h2 className="mb-4 text-lg text-madeira-800">{editingGroup ? "Editar grupo" : "Novo grupo"}</h2>
              <AdminForm action={saveAddonGroup} resetOnSuccess={!editingGroup} onSuccessHref={editingGroup ? "/admin/adicionais" : undefined} key={editingGroup?.id ?? "new"}>
                <input type="hidden" name="id" value={editingGroup?.id ?? ""} />
                <Field label="Nome do grupo"><Input name="name" required defaultValue={editingGroup?.name} placeholder="Ex.: Turbine seu lanche" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mínimo" hint="0 = opcional"><Input name="minSelect" type="number" min={0} defaultValue={editingGroup?.minSelect ?? 0} /></Field>
                  <Field label="Máximo"><Input name="maxSelect" type="number" min={1} defaultValue={editingGroup?.maxSelect ?? 5} /></Field>
                </div>
              </AdminForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
