import Link from "next/link";
import { Pause, Play, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { toggleProductPaused } from "@/actions/admin/catalog";
import { formatMoney } from "@/lib/format";
import { PRODUCT_KIND_LABELS, type ProductKind } from "@/lib/constants";
import { PageHeader, Table, Td } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { SafeImage } from "@/components/ui/safe-image";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string; tipo?: string }> }) {
  const { q, categoria, tipo } = await searchParams;
  const [categories, products] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: {
        ...(q ? { name: { contains: q } } : {}),
        ...(categoria ? { categoryId: Number(categoria) } : {}),
        ...(tipo ? { kind: tipo } : {}),
      },
      include: { category: true, variants: true, pizzaPrices: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const priceLabel = (p: (typeof products)[number]) => {
    if (p.kind === "PIZZA") return p.pizzaPrices.length ? `${formatMoney(Math.min(...p.pizzaPrices.map((x) => x.price)))} – ${formatMoney(Math.max(...p.pizzaPrices.map((x) => x.price)))}` : "—";
    if (p.kind === "VARIANT") return p.variants.length ? `a partir de ${formatMoney(Math.min(...p.variants.map((x) => x.price)))}` : "—";
    return formatMoney(p.basePrice);
  };

  return (
    <>
      <PageHeader
        title="Produtos"
        description="Pizzas (sabores), lanches, marmitex, carnes, bebidas e sobremesas. Pause itens esgotados com um clique."
        actions={<Link href="/admin/produtos/novo" className={buttonClasses("primary")}><Plus className="h-4 w-4" /> Novo produto</Link>}
      />
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px_220px_auto]">
        <Input name="q" placeholder="Buscar por nome" defaultValue={q} />
        <Select name="categoria" defaultValue={categoria ?? ""}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select name="tipo" defaultValue={tipo ?? ""}>
          <option value="">Todos os tipos</option>
          {Object.entries(PRODUCT_KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <button className={buttonClasses("outline")}>Filtrar</button>
      </form>

      <Table head={["Produto", "Categoria", "Preço", "Status", ""]}>
        {products.map((p) => (
          <tr key={p.id} className={p.paused ? "bg-madeira-50/50" : ""}>
            <Td>
              <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-3 font-semibold hover:text-brasa-700">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"><SafeImage src={p.imageUrl} alt="" fill sizes="40px" className="object-cover" /></span>
                <span>
                  {p.name}
                  <span className="block text-xs font-normal text-madeira-400">{PRODUCT_KIND_LABELS[p.kind as ProductKind]}</span>
                </span>
              </Link>
            </Td>
            <Td>{p.category.name}</Td>
            <Td className="whitespace-nowrap">{priceLabel(p)}</Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {p.paused ? <Badge tone="neutral">Pausado</Badge> : <Badge tone="green">Ativo</Badge>}
                {p.featured && <Badge tone="yellow">Destaque</Badge>}
              </div>
            </Td>
            <Td>
              <form action={toggleProductPaused}>
                <input type="hidden" name="id" value={p.id} />
                <button className={buttonClasses(p.paused ? "outline" : "ghost", "sm")} title={p.paused ? "Reativar" : "Pausar"}>
                  {p.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {p.paused ? "Reativar" : "Pausar"}
                </button>
              </form>
            </Td>
          </tr>
        ))}
      </Table>
      {products.length === 0 && <p className="py-10 text-center text-madeira-400">Nenhum produto encontrado.</p>}
    </>
  );
}
