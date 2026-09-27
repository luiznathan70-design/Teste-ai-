"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct } from "@/actions/admin/catalog";
import { AdminForm } from "./admin-form";
import { ImageUpload } from "./image-upload";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { centsToInput } from "@/lib/format";
import { PRODUCT_KIND_LABELS, SECTOR_LABELS, type Sector } from "@/lib/constants";

type Props = {
  product?: {
    id: number;
    name: string;
    description: string;
    imageUrl: string | null;
    kind: string;
    basePrice: number;
    categoryId: number;
    paused: boolean;
    featured: boolean;
    tags: string;
    sortOrder: number;
    variants: { name: string; price: number }[];
    pizzaPrices: { sizeId: number; price: number }[];
    addonGroups: { id: number }[];
  };
  categories: { id: number; name: string; sector: string }[];
  sizes: { id: number; name: string }[];
  addonGroups: { id: number; name: string }[];
  defaultKind?: string;
};

export function ProductForm({ product, categories, sizes, addonGroups, defaultKind }: Props) {
  const [kind, setKind] = useState(product?.kind ?? defaultKind ?? "SIMPLE");
  const [variants, setVariants] = useState(
    product?.variants.length ? product.variants.map((v) => ({ name: v.name, price: centsToInput(v.price) })) : [{ name: "", price: "" }],
  );

  return (
    <AdminForm action={saveProduct} submitLabel={product ? "Salvar alterações" : "Criar produto"}>
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <Field label="Nome">
              <Input name="name" required defaultValue={product?.name} />
            </Field>
            <Field label="Descrição">
              <Textarea name="description" rows={3} defaultValue={product?.description} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <Select name="categoryId" required defaultValue={product?.categoryId ?? ""}>
                  <option value="">Selecione...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({SECTOR_LABELS[c.sector as Sector]})</option>
                  ))}
                </Select>
              </Field>
              <Field label="Tipo de preço">
                <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                  {Object.entries(PRODUCT_KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-lg text-madeira-800">Preço</h2>
            {kind === "SIMPLE" && (
              <Field label="Preço (R$)" className="max-w-xs">
                <Input name="basePrice" inputMode="decimal" required defaultValue={centsToInput(product?.basePrice)} placeholder="0,00" />
              </Field>
            )}
            {kind === "PIZZA" && (
              <>
                <p className="text-sm text-madeira-500">Preço deste sabor em cada tamanho. Deixe em branco se não for vendido naquele tamanho. No meio a meio, vale o preço do sabor mais caro.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {sizes.map((s) => (
                    <Field key={s.id} label={s.name}>
                      <Input name={`size_${s.id}`} inputMode="decimal" placeholder="0,00" defaultValue={centsToInput(product?.pizzaPrices.find((p) => p.sizeId === s.id)?.price)} />
                    </Field>
                  ))}
                </div>
              </>
            )}
            {kind === "VARIANT" && (
              <>
                <p className="text-sm text-madeira-500">Ex.: Marmitex P / M / G, 500g / 1kg, Lata / 2 litros.</p>
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <Input name="variant_name" placeholder="Nome da opção" value={v.name} onChange={(e) => setVariants((cur) => cur.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                      <Input name="variant_price" className="w-32" inputMode="decimal" placeholder="0,00" value={v.price} onChange={(e) => setVariants((cur) => cur.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
                      <button type="button" className="px-2 text-madeira-400 hover:text-brasa-600" onClick={() => setVariants((cur) => cur.filter((_, j) => j !== i))} aria-label="Remover opção">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setVariants((cur) => [...cur, { name: "", price: "" }])} className="inline-flex items-center gap-1 text-sm font-semibold text-brasa-700">
                  <Plus className="h-4 w-4" /> Adicionar opção
                </button>
              </>
            )}
          </Card>

          {kind !== "PIZZA" && addonGroups.length > 0 && (
            <Card className="space-y-3 p-5">
              <h2 className="text-lg text-madeira-800">Adicionais</h2>
              <p className="text-sm text-madeira-500">Grupos de adicionais que o cliente pode escolher neste produto.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {addonGroups.map((g) => (
                  <Checkbox key={g.id} name="addonGroupIds" value={g.id} label={g.name} defaultChecked={product?.addonGroups.some((a) => a.id === g.id)} />
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="space-y-3 p-5">
            <h2 className="text-lg text-madeira-800">Foto</h2>
            <ImageUpload name="imageUrl" defaultValue={product?.imageUrl} />
          </Card>
          <Card className="space-y-3 p-5">
            <h2 className="text-lg text-madeira-800">Exibição</h2>
            <Checkbox name="paused" label="Pausado (esgotado / não vender)" defaultChecked={product?.paused} />
            <Checkbox name="featured" label="Destaque na página inicial" defaultChecked={product?.featured} />
            <Field label="Etiquetas" hint="Separadas por vírgula: vegetariano, picante, doce">
              <Input name="tags" defaultValue={product?.tags} />
            </Field>
            <Field label="Ordem" hint="Menor aparece primeiro">
              <Input name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} />
            </Field>
          </Card>
        </div>
      </div>
    </AdminForm>
  );
}
