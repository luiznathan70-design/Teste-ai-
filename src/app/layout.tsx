import type { Metadata, Viewport } from "next";
import { Alfa_Slab_One, Inter, Rye } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const alfa = Alfa_Slab_One({ subsets: ["latin"], weight: "400", variable: "--font-alfa" });
const rye = Rye({ subsets: ["latin"], weight: "400", variable: "--font-rye" });

export const metadata: Metadata = {
  title: { default: "Ranchos Pizzaria — Pizza, lanches, almoço e churrasco", template: "%s | Ranchos Pizzaria" },
  description:
    "Pizzas no forno, hambúrgueres artesanais, almoço self-service e churrasco na brasa. Peça online para entrega ou retirada.",
};

export const viewport: Viewport = {
  themeColor: "#b3261e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${alfa.variable} ${rye.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
