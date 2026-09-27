"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#b3261e", "#e09e12", "#5c3a21", "#946a44", "#0284c7", "#059669"];
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function RevenueChart({ data }: { data: { label: string; total: number; pedidos: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadccd" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7a5230" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#946a44" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
          <Tooltip formatter={(v, name) => (name === "total" ? [brl(Number(v)), "Faturamento"] : [v, "Pedidos"])} cursor={{ fill: "#fbebcb" }} />
          <Bar dataKey="total" fill="#b3261e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SectorChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-madeira-400">Sem vendas no período.</p>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => brl(Number(v))} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopItemsChart({ data }: { data: { name: string; qty: number }[] }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-madeira-400">Sem vendas no período.</p>;
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eadccd" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#946a44" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12, fill: "#4a2e1a" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [v, "Unidades"]} cursor={{ fill: "#fbebcb" }} />
          <Bar dataKey="qty" fill="#e09e12" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
