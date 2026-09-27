import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { getHours, loadCatalog } from "@/lib/catalog";
import { openSectors, todayHoursLabel } from "@/lib/hours";
import { SECTORS } from "@/lib/constants";

export const metadata: Metadata = { title: "Cardápio" };

export default async function MenuPage() {
  const [catalog, hours] = await Promise.all([loadCatalog(), getHours()]);
  const open = openSectors(hours);
  const sectorHours = Object.fromEntries(SECTORS.map((s) => [s, todayHoursLabel(s, hours)]));

  return (
    <div className="container-page pt-6">
      <h1 className="text-3xl text-madeira-800 sm:text-4xl">Cardápio</h1>
      <p className="mt-1 text-madeira-500">Escolha, personalize e peça para entrega ou retirada.</p>
      <Suspense>
        <MenuBrowser
          categories={catalog.categories}
          products={catalog.products}
          pizza={catalog.pizza}
          openSectors={open}
          sectorHours={sectorHours}
        />
      </Suspense>
    </div>
  );
}
