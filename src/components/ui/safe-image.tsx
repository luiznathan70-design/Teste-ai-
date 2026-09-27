"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Imagem com fallback: se a URL falhar (ex.: placeholder removido),
 * mostra um bloco com a identidade visual em vez de um ícone quebrado.
 */
export function SafeImage({ src, alt, className, ...props }: Omit<ImageProps, "src"> & { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // A imagem pode falhar antes da hidratação (onError não dispara): confere ao montar
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br from-madeira-600 to-brasa-700", props.fill && "absolute inset-0", className)}>
        <UtensilsCrossed className="h-1/4 max-h-12 w-1/4 max-w-12 text-creme-200/70" aria-hidden />
        <span className="sr-only">{alt}</span>
      </div>
    );
  }
  const local = src.startsWith("/");
  return <Image ref={ref} src={src} alt={alt} className={className} onError={() => setFailed(true)} unoptimized={local} {...props} />;
}
