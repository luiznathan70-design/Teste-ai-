import Link from "next/link";
import { db } from "@/lib/db";
import { deleteCoupon, saveCoupon } from "@/actions/admin/business";
import { centsToInput, formatMoney } from "@/lib/format";
import { PageHeader, Table, Td } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { DeleteButton } from "@/components/admin/confirm-button";
import { Badge, Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";

const isoDate = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d) : "");

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const editing = coupons.find((c) => c.id === Number(editar));
  const now = new Date();
  return (
    <>
      <PageHeader title="Cupons de desconto" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Table head={["Código", "Desconto", "Mínimo", "Usos", "Validade", ""]}>
          {coupons.map((c) => {
            const expired = c.expiresAt && c.expiresAt < now;
            const exhausted = c.maxUses !== null && c.uses >= c.maxUses;
            return (
              <tr key={c.id}>
                <Td>
                  <span className="font-mono font-bold">{c.code}</span>{" "}
                  {!c.active ? <Badge>Inativo</Badge> : expired ? <Badge tone="red">Expirado</Badge> : exhausted ? <Badge tone="red">Esgotado</Badge> : <Badge tone="green">Ativo</Badge>}
                </Td>
                <Td>{c.type === "PERCENT" ? `${c.value}%` : formatMoney(c.value)}</Td>
                <Td>{c.minOrder ? formatMoney(c.minOrder) : "—"}</Td>
                <Td>{c.uses}{c.maxUses !== null ? ` / ${c.maxUses}` : ""}</Td>
                <Td>{c.expiresAt ? isoDate(c.expiresAt).split("-").reverse().join("/") : "Sem validade"}</Td>
                <Td className="text-right whitespace-nowrap">
                  <Link href={`?editar=${c.id}`} className="mr-2 text-sm font-semibold underline">Editar</Link>
                  <form action={deleteCoupon} className="inline">
                    <input type="hidden" name="id" value={c.id} />
                    <DeleteButton iconOnly />
                  </form>
                </Td>
              </tr>
            );
          })}
        </Table>
        <Card className="p-5 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-4 text-lg text-madeira-800">{editing ? "Editar cupom" : "Novo cupom"}</h2>
          <AdminForm action={saveCoupon} resetOnSuccess={!editing} onSuccessHref={editing ? "/admin/cupons" : undefined} key={editing?.id ?? "new"}>
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <Field label="Código"><Input name="code" required defaultValue={editing?.code} className="uppercase" placeholder="EX.: PIZZA10" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <Select name="type" defaultValue={editing?.type ?? "PERCENT"}>
                  <option value="PERCENT">Percentual (%)</option>
                  <option value="FIXED">Valor fixo (R$)</option>
                </Select>
              </Field>
              <Field label="Valor" hint="10 = 10% ou R$ 10,00">
                <Input name="value" required inputMode="decimal" defaultValue={editing ? (editing.type === "PERCENT" ? editing.value : centsToInput(editing.value)) : ""} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pedido mínimo (R$)"><Input name="minOrder" inputMode="decimal" defaultValue={centsToInput(editing?.minOrder)} /></Field>
              <Field label="Limite de usos" hint="Vazio = ilimitado"><Input name="maxUses" type="number" min={1} defaultValue={editing?.maxUses ?? ""} /></Field>
            </div>
            <Field label="Válido até"><Input name="expiresAt" type="date" defaultValue={isoDate(editing?.expiresAt ?? null)} /></Field>
            <Checkbox name="active" label="Ativo" defaultChecked={editing?.active ?? true} />
          </AdminForm>
        </Card>
      </div>
    </>
  );
}
