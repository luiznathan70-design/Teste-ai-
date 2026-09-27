import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-madeira-100 bg-white shadow-card", className)} {...props} />;
}

type Tone = "neutral" | "red" | "yellow" | "green" | "wood" | "blue";
const tones: Record<Tone, string> = {
  neutral: "bg-madeira-50 text-madeira-700",
  red: "bg-brasa-100 text-brasa-700",
  yellow: "bg-milho-300/50 text-madeira-800",
  green: "bg-emerald-100 text-emerald-800",
  wood: "bg-madeira-700 text-creme-100",
  blue: "bg-sky-100 text-sky-800",
};

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone], className)}
      {...props}
    />
  );
}

export function SectionTitle({ eyebrow, title, subtitle, className }: { eyebrow?: string; title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn("mb-8 text-center", className)}>
      {eyebrow && <p className="font-western text-sm tracking-widest text-brasa-600 uppercase">{eyebrow}</p>}
      <h2 className="mt-1 text-3xl text-madeira-800 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-2xl text-madeira-500">{subtitle}</p>}
    </div>
  );
}
