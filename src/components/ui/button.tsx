import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "wood";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-brasa-600 text-white hover:bg-brasa-700 shadow-sm",
  secondary: "bg-milho-400 text-madeira-900 hover:bg-milho-500 shadow-sm",
  outline: "border border-madeira-200 bg-white text-madeira-800 hover:bg-creme-100",
  ghost: "text-madeira-700 hover:bg-madeira-50",
  danger: "bg-white text-brasa-700 border border-brasa-200 hover:bg-brasa-50",
  wood: "bg-madeira-700 text-creme-100 hover:bg-madeira-800 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
    variants[variant],
    sizes[size],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />;
});
