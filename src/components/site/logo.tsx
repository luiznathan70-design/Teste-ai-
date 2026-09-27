import { cn } from "@/lib/utils";

/** Logotipo em texto (substitua por <Image> quando houver logo oficial em Configurações) */
export function Logo({ name = "Ranchos Pizzaria", className, dark, logoUrl }: { name?: string; className?: string; dark?: boolean; logoUrl?: string | null }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className={cn("h-11 w-auto object-contain", className)} />;
  }
  const [first, ...rest] = name.split(" ");
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-milho-400 bg-brasa-600 font-western text-lg text-creme-100 shadow-inner">
        {first.charAt(0)}
      </span>
      <span className="leading-none">
        <span className={cn("block font-western text-xl", dark ? "text-brasa-700" : "text-creme-100")}>{first}</span>
        {rest.length > 0 && (
          <span className={cn("block text-[10px] font-bold tracking-[0.3em] uppercase", dark ? "text-madeira-500" : "text-milho-400")}>
            {rest.join(" ")}
          </span>
        )}
      </span>
    </span>
  );
}
