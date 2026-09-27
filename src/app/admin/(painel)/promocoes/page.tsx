import Link from "next/link";
import { db } from "@/lib/db";
import { deletePromotion, savePromotion } from "@/actions/admin/business";
import { PageHeader } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { DeleteButton } from "@/components/admin/confirm-button";
import { ImageUpload } from "@/components/admin/image-upload";
import { Badge, Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { SafeImage } from "@/components/ui/safe-image";

const isoDate = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d) : "");

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const promos = await db.promotion.findMany({ orderBy: { sortOrder: "asc" } });
  const editing = promos.find((p) => p.id === Number(editar));
  return (
    <>
      <PageHeader title="Promoções" description="Banners exibidos na página inicial. Use as datas para agendar início e fim." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {promos.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="relative aspect-[16/9]"><SafeImage src={p.imageUrl} alt={p.title} fill sizes="400px" className="object-cover" /></div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-sans text-base font-bold tracking-normal">{p.title}</h2>
                  {p.active ? <Badge tone="green">Ativa</Badge> : <Badge>Inativa</Badge>}
                </div>
                <p className="mt-1 text-sm text-madeira-500">{p.description}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Link href={`?editar=${p.id}`} className="text-sm font-semibold underline">Editar</Link>
                  <form action={deletePromotion}>
                    <input type="hidden" name="id" value={p.id} />
                    <DeleteButton />
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-5 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-4 text-lg text-madeira-800">{editing ? "Editar promoção" : "Nova promoção"}</h2>
          <AdminForm action={savePromotion} resetOnSuccess={!editing} onSuccessHref={editing ? "/admin/promocoes" : undefined} key={editing?.id ?? "new"}>
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <Field label="Título"><Input name="title" required defaultValue={editing?.title} /></Field>
            <Field label="Descrição"><Textarea name="description" defaultValue={editing?.description} /></Field>
            <Field label="Imagem"><ImageUpload name="imageUrl" defaultValue={editing?.imageUrl} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Selo" hint="Ex.: -20%, Terça"><Input name="badge" defaultValue={editing?.badge ?? ""} /></Field>
              <Field label="Ordem"><Input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? promos.length} /></Field>
            </div>
            <Field label="Link" hint="Ex.: /cardapio?categoria=pizzas-salgadas"><Input name="link" defaultValue={editing?.link ?? ""} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início"><Input name="startsAt" type="date" defaultValue={isoDate(editing?.startsAt ?? null)} /></Field>
              <Field label="Fim"><Input name="endsAt" type="date" defaultValue={isoDate(editing?.endsAt ?? null)} /></Field>
            </div>
            <Checkbox name="active" label="Ativa" defaultChecked={editing?.active ?? true} />
          </AdminForm>
        </Card>
      </div>
    </>
  );
}
