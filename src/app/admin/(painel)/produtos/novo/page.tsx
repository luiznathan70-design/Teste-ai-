import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const [categories, sizes, addonGroups] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.pizzaSize.findMany({ orderBy: { sortOrder: "asc" } }),
    db.addonGroup.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Novo produto" />
      <ProductForm categories={categories} sizes={sizes} addonGroups={addonGroups} defaultKind={tipo} />
    </>
  );
}
