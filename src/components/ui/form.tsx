import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-madeira-200 bg-white px-3 text-sm text-madeira-900 placeholder:text-madeira-300 focus:border-brasa-500 focus:outline-none focus:ring-2 focus:ring-brasa-100 disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(field, "h-10", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(field, "min-h-20 py-2", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cn(field, "h-10", className)} {...props} />;
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-medium text-madeira-700", className)} {...props} />;
}

/** Label + campo + mensagem de ajuda/erro */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* O <label> envolve o campo: associação implícita, sem precisar de id */}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-madeira-700">{label}</span>
        {children}
      </label>
      {error ? <p className="mt-1 text-xs text-brasa-700">{error}</p> : hint ? <p className="mt-1 text-xs text-madeira-400">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm text-madeira-800", className)}>
      <input type="checkbox" className="h-4 w-4 accent-brasa-600" {...props} />
      {label}
    </label>
  );
}
