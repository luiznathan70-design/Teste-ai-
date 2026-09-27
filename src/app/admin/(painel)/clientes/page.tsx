import { db } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { PageHeader, Table, Td } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { normalizeSearch } from "@/lib/utils";

/**
 * Clientes = todos que já pediram (agrupados pelo telefone) + contas cadastradas.
 * Como o pedido pode ser feito sem conta, o telefone é o identificador principal.
 */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [orders, users] = await Promise.all([
    db.order.findMany({
      where: { status: { not: "CANCELADO" } },
      select: { customerName: true, customerPhone: true, total: true, createdAt: true, neighborhoodName: true, userId: true },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({ where: { role: "CUSTOMER" }, select: { id: true, name: true, email: true, phone: true, createdAt: true } }),
  ]);

  type Row = { key: string; name: string; phone: string; email?: string; orders: number; spent: number; last?: Date; neighborhood?: string | null; registered: boolean };
  const map = new Map<string, Row>();
  const keyOf = (phone: string) => phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");

  for (const o of orders) {
    const key = keyOf(o.customerPhone);
    const row = map.get(key) ?? { key, name: o.customerName, phone: o.customerPhone, orders: 0, spent: 0, last: o.createdAt, neighborhood: o.neighborhoodName, registered: false };
    row.orders += 1;
    row.spent += o.total;
    if (o.userId) row.registered = true;
    map.set(key, row);
  }
  for (const u of users) {
    const key = keyOf(u.phone ?? "") || `u${u.id}`;
    const row = map.get(key) ?? { key, name: u.name, phone: u.phone ?? "", orders: 0, spent: 0, registered: true };
    row.email = u.email;
    row.registered = true;
    map.set(key, row);
  }

  let rows = [...map.values()].sort((a, b) => b.spent - a.spent);
  if (q) {
    const nq = normalizeSearch(q);
    rows = rows.filter((r) => normalizeSearch(`${r.name} ${r.phone} ${r.email ?? ""}`).includes(nq));
  }

  return (
    <>
      <PageHeader title="Clientes" description={`${rows.length} clientes · ordenados por valor gasto`} />
      <form className="mb-4 flex max-w-md gap-2">
        <Input name="q" placeholder="Buscar por nome, telefone ou e-mail" defaultValue={q} />
        <button className={buttonClasses("outline")}>Buscar</button>
      </form>
      <Table head={["Cliente", "Telefone", "Pedidos", "Total gasto", "Último pedido", ""]}>
        {rows.map((r) => (
          <tr key={r.key}>
            <Td>
              <span className="font-semibold">{r.name}</span> {r.registered && <Badge tone="blue">Cadastrado</Badge>}
              {r.email && <span className="block text-xs text-madeira-400">{r.email}</span>}
              {r.neighborhood && <span className="block text-xs text-madeira-400">{r.neighborhood}</span>}
            </Td>
            <Td className="whitespace-nowrap">{r.phone}</Td>
            <Td>{r.orders}</Td>
            <Td className="font-semibold">{formatMoney(r.spent)}</Td>
            <Td className="whitespace-nowrap">{r.last ? formatDateTime(r.last) : "—"}</Td>
            <Td>
              {r.phone && (
                <a href={whatsappLink(`55${r.phone.replace(/\D/g, "")}`)} target="_blank" rel="noopener noreferrer" className="text-[#25D366]" title="WhatsApp">
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
              )}
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
