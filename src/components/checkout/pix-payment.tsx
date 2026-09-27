"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

/** QR Code Pix + "copia e cola" + chave */
export function PixPayment({ payload, qrDataUrl, pixKey, total }: { payload: string; qrDataUrl: string; pixKey: string; total: number }) {
  const [copied, setCopied] = useState<"payload" | "key" | null>(null);

  async function copy(text: string, which: "payload" | "key") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt="QR Code Pix" className="mx-auto h-56 w-56 rounded-xl border border-madeira-100 bg-white p-2" />
      <div>
        <h2 className="text-xl text-madeira-800">Pague com Pix</h2>
        <p className="mt-1 text-sm text-madeira-600">
          Escaneie o QR Code ou copie o código abaixo no app do seu banco. Valor: <strong>{formatMoney(total)}</strong>
        </p>
        <Button className="mt-4 w-full" onClick={() => copy(payload, "payload")}>
          {copied === "payload" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied === "payload" ? "Código copiado!" : "Copiar Pix copia e cola"}
        </Button>
        <button onClick={() => copy(pixKey, "key")} className="mt-3 w-full text-center text-sm text-madeira-600 hover:underline">
          Chave Pix: <strong>{pixKey}</strong> {copied === "key" ? "(copiada)" : "(copiar)"}
        </button>
        <p className="mt-3 text-xs text-madeira-400">Após o pagamento, a confirmação é feita pela nossa equipe.</p>
      </div>
    </div>
  );
}
