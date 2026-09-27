import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteProduct } from "@/actions/admin/catalog";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteButton } from "@/components/admin/confirm-button";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string }> }) {
  const { id } = await params;
  const { salvo } = await searchParams;
  const [product, categories, sizes, addonGroups] = await Promise.all([
    db.product.findUnique({ where: { id: Number(id) }, include: { variants: { orderBy: { sortOrder: "asc" } }, pizzaPrices: true, addonGroups: true } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.pizzaSize.findMany({ orderBy: { sortOrder: "asc" } }),
    db.addonGroup.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <>
      <PageHeader
        title={product.name}
        description={salvo ? "✓ Produto criado com sucesso." : undefined}
        actions={
          <>
            <Link href={`/cardapio?produto=${product.slug}`} target="_blank" className="text-sm font-semibold text-madeira-600 underline">Ver no site</Link>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <DeleteButton message="Excluir este produto? Pedidos antigos continuam registrados." />
            </form>
          </>
        }
      />
      <ProductForm product={product} categories={categories} sizes={sizes} addonGroups={addonGroups} />
    </>
  );
}
