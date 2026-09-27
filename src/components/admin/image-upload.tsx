"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Input } from "@/components/ui/form";

/** Campo de imagem: envia arquivo para /api/upload ou aceita uma URL colada */
export function ImageUpload({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha no upload");
      setUrl(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      <input type="hidden" name={name} value={url} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-madeira-200 bg-creme-50 text-madeira-400 hover:border-brasa-500"
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : url ? (
          <SafeImage src={url} alt="Pré-visualização" fill sizes="112px" className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs"><ImagePlus className="h-6 w-6" />Enviar foto</span>
        )}
      </button>
      <div className="flex-1 space-y-2">
        <Input placeholder="ou cole a URL da imagem" value={url} onChange={(e) => setUrl(e.target.value)} />
        {url && (
          <button type="button" onClick={() => setUrl("")} className="inline-flex items-center gap-1 text-xs text-madeira-500 hover:text-brasa-700">
            <X className="h-3 w-3" /> Remover imagem
          </button>
        )}
        {error && <p className="text-xs text-brasa-700">{error}</p>}
        <p className="text-xs text-madeira-400">JPG, PNG ou WEBP até 4 MB.</p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
    </div>
  );
}
