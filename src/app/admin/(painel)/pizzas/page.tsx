import Link from "next/link";
import { db } from "@/lib/db";
import { deleteCrust, saveCrust, saveSize } from "@/actions/admin/catalog";
import { centsToInput, formatMoney } from "@/lib/format";
import { PageHeader, Table, Td } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { DeleteButton } from "@/components/admin/confirm-button";
import { Badge, Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";

export default async function PizzaSettingsPage({ searchParams }: { searchParams: Promise<{ tamanho?: string; borda?: string }> }) {
  const { tamanho, borda } = await searchParams;
  const [sizes, crusts] = await Promise.all([
    db.pizzaSize.findMany({ orderBy: { sortOrder: "asc" } }),
    db.crust.findMany({ include: { prices: true }, orderBy: { name: "asc" } }),
  ]);
  const editingSize = sizes.find((s) => s.id === Number(tamanho));
  const editingCrust = crusts.find((c) => c.id === Number(borda));

  return (
    <>
      <PageHeader
        title="Pizzas: tamanhos e bordas"
        description="Os sabores são cadastrados em Produtos (tipo “Sabor de pizza”), com preço por tamanho."
        actions={<Link href="/admin/produtos?tipo=PIZZA" className={buttonClasses("outline")}>Ver sabores</Link>}
      />

      <h2 className="mb-3 text-xl text-madeira-800">Tamanhos</h2>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Table head={["Tamanho", "Fatias", "Máx. sabores", "Status", ""]}>
          {sizes.map((s) => (
            <tr key={s.id}>
              <Td className="font-semibold">{s.name}</Td>
              <Td>{s.slices}</Td>
              <Td>{s.maxFlavors}</Td>
              <Td>{s.active ? <Badge tone="green">Ativo</Badge> : <Badge>Inativo</Badge>}</Td>
              <Td className="text-right"><Link href={`?tamanho=${s.id}`} className="text-sm font-semibold underline">Editar</Link></Td>
            </tr>
          ))}
        </Table>
        <Card className="p-5">
          <h3 className="mb-4 text-lg text-madeira-800">{editingSize ? `Editar ${editingSize.name}` : "Novo tamanho"}</h3>
          <AdminForm action={saveSize} resetOnSuccess={!editingSize} onSuccessHref={editingSize ? "/admin/pizzas" : undefined} key={editingSize?.id ?? "new"}>
            <input type="hidden" name="id" value={editingSize?.id ?? ""} />
            <Field label="Nome"><Input name="name" required defaultValue={editingSize?.name} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Fatias"><Input name="slices" type="number" min={1} defaultValue={editingSize?.slices ?? 8} /></Field>
              <Field label="Sabores">
                <Select name="maxFlavors" defaultValue={editingSize?.maxFlavors ?? 2}>
                  <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
                </Select>
              </Field>
              <Field label="Ordem"><Input name="sortOrder" type="number" defaultValue={editingSize?.sortOrder ?? sizes.length} /></Field>
            </div>
            <Checkbox name="active" label="Ativo" defaultChecked={editingSize?.active ?? true} />
          </AdminForm>
        </Card>
      </div>

      <h2 className="mt-10 mb-3 text-xl text-madeira-800">Bordas recheadas</h2>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Table head={["Borda", ...sizes.map((s) => s.name), ""]}>
          {crusts.map((c) => (
            <tr key={c.id}>
              <Td className="font-semibold">{c.name} {!c.active && <Badge>Inativa</Badge>}</Td>
              {sizes.map((s) => {
                const p = c.prices.find((x) => x.sizeId === s.id);
                return <Td key={s.id}>{p ? formatMoney(p.price) : "—"}</Td>;
              })}
              <Td className="text-right whitespace-nowrap">
                <Link href={`?borda=${c.id}`} className="mr-2 text-sm font-semibold underline">Editar</Link>
                <form action={deleteCrust} className="inline">
                  <input type="hidden" name="id" value={c.id} />
                  <DeleteButton iconOnly />
                </form>
              </Td>
            </tr>
          ))}
        </Table>
        <Card className="p-5">
          <h3 className="mb-4 text-lg text-madeira-800">{editingCrust ? `Editar ${editingCrust.name}` : "Nova borda"}</h3>
          <AdminForm action={saveCrust} resetOnSuccess={!editingCrust} onSuccessHref={editingCrust ? "/admin/pizzas" : undefined} key={editingCrust?.id ?? "new"}>
            <input type="hidden" name="id" value={editingCrust?.id ?? ""} />
            <Field label="Nome"><Input name="name" required defaultValue={editingCrust?.name} /></Field>
            <div className="grid grid-cols-2 gap-3">
              {sizes.map((s) => (
                <Field key={s.id} label={`Preço ${s.name}`}>
                  <Input name={`size_${s.id}`} inputMode="decimal" placeholder="0,00" defaultValue={centsToInput(editingCrust?.prices.find((p) => p.sizeId === s.id)?.price)} />
                </Field>
              ))}
            </div>
            <Checkbox name="active" label="Ativa" defaultChecked={editingCrust?.active ?? true} />
          </AdminForm>
        </Card>
      </div>
    </>
  );
}
