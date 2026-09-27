"use client";

import { Plus } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { startingPrice, type CatalogProduct } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  available,
  onSelect,
}: {
  product: CatalogProduct;
  available: boolean;
  onSelect: () => void;
}) {
  const price = startingPrice(product);
  const fromLabel = product.kind !== "SIMPLE";
  const disabled = product.paused || !available;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex w-full gap-3 overflow-hidden rounded-2xl border border-madeira-100 bg-white p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:border-milho-400 sm:flex-col sm:p-0",
        disabled && "opacity-70",
      )}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none">
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 96px, 300px"
          className={cn("object-cover transition-transform duration-300 group-hover:scale-105", disabled && "grayscale")}
        />
        {product.featured && !disabled && (
          <Badge tone="yellow" className="absolute top-2 left-2 hidden bg-milho-400 sm:inline-flex">
            ★ Destaque
          </Badge>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans text-base font-bold tracking-normal text-madeira-900">{product.name}</h3>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-madeira-500">{product.description}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {product.paused ? (
            <Badge tone="neutral">Esgotado</Badge>
          ) : !available ? (
            <Badge tone="red">Indisponível agora</Badge>
          ) : null}
          {product.tags.map((t) => (
            <Badge key={t} tone={t === "picante" ? "red" : t === "vegetariano" ? "green" : "neutral"}>
              {t}
            </Badge>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <p className="text-lg font-extrabold text-brasa-700">
            {fromLabel && <span className="mr-1 text-xs font-medium text-madeira-400">a partir de</span>}
            {formatMoney(price)}
          </p>
          {!disabled && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brasa-600 text-white shadow group-hover:bg-brasa-700">
              <Plus className="h-5 w-5" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
