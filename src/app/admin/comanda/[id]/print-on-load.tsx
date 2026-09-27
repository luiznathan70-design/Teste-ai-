"use client";

import { useEffect } from "react";

export function PrintOnLoad() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <button onClick={() => window.print()} className="no-print mb-3 w-full rounded bg-black py-2 text-white">
      Imprimir novamente
    </button>
  );
}
