import Link from "next/link";
import { Star } from "lucide-react";
import { db } from "@/lib/db";
import { deleteTestimonial, saveTestimonial } from "@/actions/admin/business";
import { PageHeader } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { DeleteButton } from "@/components/admin/confirm-button";
import { Badge, Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";

export default async function TestimonialsPage({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const list = await db.testimonial.findMany({ orderBy: { id: "desc" } });
  const editing = list.find((t) => t.id === Number(editar));
  return (
    <>
      <PageHeader title="Depoimentos" description="Exibidos na página inicial." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {list.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{t.name} {!t.active && <Badge>Oculto</Badge>}</p>
                  <p className="flex text-milho-500">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`?editar=${t.id}`} className="text-sm font-semibold underline">Editar</Link>
                  <form action={deleteTestimonial}><input type="hidden" name="id" value={t.id} /><DeleteButton iconOnly /></form>
                </div>
              </div>
              <p className="mt-2 text-sm text-madeira-600">“{t.text}”</p>
            </Card>
          ))}
        </div>
        <Card className="p-5 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-4 text-lg text-madeira-800">{editing ? "Editar depoimento" : "Novo depoimento"}</h2>
          <AdminForm action={saveTestimonial} resetOnSuccess={!editing} onSuccessHref={editing ? "/admin/depoimentos" : undefined} key={editing?.id ?? "new"}>
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <Field label="Nome do cliente"><Input name="name" required defaultValue={editing?.name} /></Field>
            <Field label="Depoimento"><Textarea name="text" required rows={4} defaultValue={editing?.text} /></Field>
            <Field label="Nota">
              <Select name="rating" defaultValue={editing?.rating ?? 5}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrela{n > 1 ? "s" : ""}</option>)}
              </Select>
            </Field>
            <Checkbox name="active" label="Exibir no site" defaultChecked={editing?.active ?? true} />
          </AdminForm>
        </Card>
      </div>
    </>
  );
}
