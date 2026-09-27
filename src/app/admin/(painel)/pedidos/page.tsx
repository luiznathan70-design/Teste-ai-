import type { Metadata } from "next";
import { KanbanBoard } from "@/components/admin/kanban-board";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Pedidos" };

export default function OrdersPage() {
  return (
    <>
      <PageHeader title="Pedidos em tempo real" description="Atualiza a cada 5 segundos. Ative o som para ouvir quando chegar pedido novo." />
      <KanbanBoard />
    </>
  );
}
