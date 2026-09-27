import Link from "next/link";
import { db } from "@/lib/db";
import { deleteCategory, saveCategory } from "@/actions/admin/catalog";
import { SECTORS, SECTOR_LABELS } from "@/lib/constants";
import { PageHeader, Table, Td } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { DeleteButton } from "@/components/admin/confirm-button";
import { Badge, Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const categories = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }], include: { _count: { select: { products: true } } } });
  const editing = categories.find((c) => c.id === Number(editar));

  return (
    <>
      <PageHeader title="Categorias" description="Organizam o cardápio. Cada categoria pertence a um setor, que define o horário de venda." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Table head={["Categoria", "Setor", "Produtos", "Ordem", ""]}>
          {categories.map((c) => (
            <tr key={c.id}>
              <Td>
                <span className="font-semibold">{c.name}</span> {!c.active && <Badge>Inativa</Badge>}
              </Td>
              <Td>{SECTOR_LABELS[c.sector as keyof typeof SECTOR_LABELS]}</Td>
              <Td><Link href={`/admin/produtos?categoria=${c.id}`} className="underline">{c._count.products}</Link></Td>
              <Td>{c.sortOrder}</Td>
              <Td className="text-right whitespace-nowrap">
                <Link href={`?editar=${c.id}`} className="mr-2 text-sm font-semibold text-madeira-600 underline">Editar</Link>
                <form action={deleteCategory} className="inline">
                  <input type="hidden" name="id" value={c.id} />
                  <DeleteButton iconOnly message="Excluir categoria? Se tiver produtos, ela será apenas desativada." />
                </form>
              </Td>
            </tr>
          ))}
        </Table>

        <Card className="p-5 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-4 text-lg text-madeira-800">{editing ? "Editar categoria" : "Nova categoria"}</h2>
          <AdminForm action={saveCategory} resetOnSuccess={!editing} onSuccessHref={editing ? "/admin/categorias" : undefined} key={editing?.id ?? "new"}>
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <Field label="Nome"><Input name="name" required defaultValue={editing?.name} /></Field>
            <Field label="Setor">
              <Select name="sector" defaultValue={editing?.sector ?? "PIZZARIA"}>
                {SECTORS.map((s) => <option key={s} value={s}>{SECTOR_LABELS[s]}</option>)}
              </Select>
            </Field>
            <Field label="Ordem"><Input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? categories.length} /></Field>
            <Checkbox name="active" label="Ativa (aparece no site)" defaultChecked={editing?.active ?? true} />
          </AdminForm>
          {editing && <Link href="/admin/categorias" className="mt-3 block text-sm text-madeira-500 underline">Cancelar edição</Link>}
        </Card>
      </div>
    </>
  );
}
