"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";

/** true depois que o carrinho foi carregado do localStorage */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useCart.persist.onFinishHydration(() => setHydrated(true));
    if (!useCart.persist.hasHydrated()) void useCart.persist.rehydrate();
    else setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
