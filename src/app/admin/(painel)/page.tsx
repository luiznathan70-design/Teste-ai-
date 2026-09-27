import Link from "next/link";
import { DollarSign, Receipt, ShoppingBag, Timer } from "lucide-react";
import { db } from "@/lib/db";
import { nowInBrazil } from "@/lib/hours";
import { formatMoney } from "@/lib/format";
import { SECTOR_LABELS, type Sector } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { RevenueChart, SectorChart, TopItemsChart } from "@/components/admin/charts";

/** Data "YYYY-MM-DD" no fuso de São Paulo */
const brDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);

export default async function DashboardPage() {
  const today = nowInBrazil().isoDate;
  const startToday = new Date(`${today}T00:00:00-03:00`);
  const start7 = new Date(startToday.getTime() - 6 * 86400000);
  const start30 = new Date(startToday.getTime() - 29 * 86400000);

  const [orders30, activeCount] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: start30 }, status: { not: "CANCELADO" } },
      select: { total: true, createdAt: true, paymentMethod: true, items: { select: { name: true, quantity: true, totalPrice: true, sector: true } } },
    }),
    db.order.count({ where: { status: { in: ["RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA", "PRONTO_RETIRADA"] } } }),
  ]);

  const todayOrders = orders30.filter((o) => o.createdAt >= startToday);
  const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0);
  const ticket = todayOrders.length ? Math.round(revenueToday / todayOrders.length) : 0;

  // Faturamento dos últimos 7 dias
  const days: { label: string; date: string; total: number; pedidos: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startToday.getTime() - i * 86400000 + 12 * 3600000);
    days.push({ date: brDate(d), label: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit" }).format(d), total: 0, pedidos: 0 });
  }
  for (const o of orders30.filter((o) => o.createdAt >= start7)) {
    const day = days.find((d) => d.date === brDate(o.createdAt));
    if (day) {
      day.total += o.total / 100;
      day.pedidos += 1;
    }
  }
  const revenue7 = days.reduce((s, d) => s + d.total, 0);

  // Itens mais vendidos e vendas por setor (30 dias)
  const itemMap = new Map<string, number>();
  const sectorMap = new Map<string, number>();
  for (const o of orders30) {
    for (const i of o.items) {
      // Agrupa pizzas pelo tamanho/sabor principal, sem detalhes
      itemMap.set(i.name, (itemMap.get(i.name) ?? 0) + i.quantity);
      sectorMap.set(i.sector, (sectorMap.get(i.sector) ?? 0) + i.totalPrice);
    }
  }
  const topItems = [...itemMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, qty]) => ({ name, qty }));
  const sectors = [...sectorMap.entries()].map(([s, v]) => ({ name: SECTOR_LABELS[s as Sector] ?? s, value: v / 100 })).sort((a, b) => b.value - a.value);

  const stats = [
    { label: "Pedidos hoje", value: String(todayOrders.length), icon: Receipt },
    { label: "Faturamento hoje", value: formatMoney(revenueToday), icon: DollarSign },
    { label: "Ticket médio hoje", value: formatMoney(ticket), icon: ShoppingBag },
    { label: "Em andamento", value: String(activeCount), icon: Timer, href: "/admin/pedidos" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Resumo das vendas. Pedidos cancelados não entram nos números." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => {
          const content = (
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brasa-50 text-brasa-700"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-xs text-madeira-500">{label}</p>
                <p className="truncate text-xl font-extrabold text-madeira-900">{value}</p>
              </div>
            </Card>
          );
          return href ? <Link key={label} href={href}>{content}</Link> : <div key={label}>{content}</div>;
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg text-madeira-800">Faturamento — últimos 7 dias</h2>
            <p className="text-sm font-bold text-madeira-600">{formatMoney(Math.round(revenue7 * 100))}</p>
          </div>
          <RevenueChart data={days} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-lg text-madeira-800">Vendas por setor (30 dias)</h2>
          <SectorChart data={sectors} />
        </Card>
        <Card className="p-5 xl:col-span-3">
          <h2 className="mb-4 text-lg text-madeira-800">Itens mais vendidos (30 dias)</h2>
          <TopItemsChart data={topItems} />
        </Card>
      </div>
    </>
  );
}
