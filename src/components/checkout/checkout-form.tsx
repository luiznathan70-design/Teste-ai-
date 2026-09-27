"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Banknote, Bike, CreditCard, QrCode, Store, Tag, X } from "lucide-react";
import { useCart, cartSubtotal } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { formatMoney, parseMoney } from "@/lib/format";
import { checkCoupon, placeOrder } from "@/actions/checkout";
import { Card } from "@/components/ui/card";
import { Button, buttonClasses } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type Neighborhood = { id: number; name: string; fee: number };
type SavedAddress = { id: number; label: string; street: string; number: string; complement: string; reference: string; neighborhoodId: number };

/** Máscara simples de telefone brasileiro */
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function CheckoutForm({
  neighborhoods,
  minOrder,
  prepTimeMin,
  user,
}: {
  neighborhoods: Neighborhood[];
  minOrder: number;
  prepTimeMin: number;
  user: { name: string; phone: string; addresses: SavedAddress[] } | null;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, setCoupon, clear } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const firstAddress = user?.addresses[0];
  const [form, setForm] = useState({
    customerName: user?.name ?? "",
    customerPhone: user?.phone ?? "",
    type: "DELIVERY" as "DELIVERY" | "PICKUP",
    street: firstAddress?.street ?? "",
    number: firstAddress?.number ?? "",
    complement: firstAddress?.complement ?? "",
    reference: firstAddress?.reference ?? "",
    neighborhoodId: firstAddress?.neighborhoodId ?? 0,
    paymentMethod: "PIX" as "PIX" | "CARD" | "CASH",
    changeFor: "",
    notes: "",
    saveAddress: !!user && !firstAddress,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const [couponInput, setCouponInput] = useState("");
  const [couponState, setCouponState] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = cartSubtotal(items);
  const neighborhood = neighborhoods.find((n) => n.id === form.neighborhoodId);
  const fee = form.type === "DELIVERY" ? neighborhood?.fee ?? 0 : 0;
  const discount = couponState?.discount ?? 0;
  const total = subtotal + fee - discount;
  const belowMinimum = form.type === "DELIVERY" && subtotal < minOrder;

  function applyCoupon(code = couponInput) {
    setCouponError(null);
    startTransition(async () => {
      const res = await checkCoupon(code, subtotal);
      if (res.ok) {
        setCouponState(res.data);
        setCoupon(res.data.code);
        setCouponInput("");
      } else {
        setCouponState(null);
        setCoupon(null);
        setCouponError(res.error);
      }
    });
  }

  function removeCoupon() {
    setCouponState(null);
    setCoupon(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const changeFor = form.paymentMethod === "CASH" && form.changeFor ? parseMoney(form.changeFor) : undefined;
    startTransition(async () => {
      const res = await placeOrder({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        type: form.type,
        street: form.street,
        number: form.number,
        complement: form.complement,
        reference: form.reference,
        neighborhoodId: form.neighborhoodId || undefined,
        paymentMethod: form.paymentMethod,
        changeFor: Number.isFinite(changeFor) ? changeFor : undefined,
        couponCode: couponState?.code,
        notes: form.notes,
        saveAddress: form.saveAddress,
        items: items.map((i) => i.selection),
      });
      if (res.ok) {
        clear();
        router.push(`/pedido/${res.data.code}?novo=1`);
      } else {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (!hydrated) return <div className="py-20 text-center text-madeira-400">Carregando...</div>;

  if (items.length === 0) {
    return (
      <Card className="mt-6 p-10 text-center">
        <p className="text-lg font-semibold">Seu carrinho está vazio.</p>
        <Link href="/cardapio" className={buttonClasses("primary", "md", "mt-4")}>Ver cardápio</Link>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {error && <div className="rounded-2xl border border-brasa-200 bg-brasa-50 p-4 text-sm font-medium text-brasa-800">{error}</div>}

        {!user && (
          <p className="rounded-2xl bg-milho-300/30 p-4 text-sm text-madeira-700">
            Pode pedir sem cadastro. Quer salvar seus endereços e ver o histórico?{" "}
            <Link href="/conta/entrar?callbackUrl=/checkout" className="font-bold text-brasa-700 underline">Entre ou crie sua conta</Link>.
          </p>
        )}

        <Card className="p-5">
          <h2 className="mb-4 text-xl text-madeira-800">Seus dados</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input required autoComplete="name" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
            </Field>
            <Field label="Telefone / WhatsApp">
              <Input required type="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={form.customerPhone} onChange={(e) => set("customerPhone", maskPhone(e.target.value))} />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-xl text-madeira-800">Entrega ou retirada?</h2>
          <div className="grid grid-cols-2 gap-3">
            <ChoiceTile active={form.type === "DELIVERY"} onClick={() => set("type", "DELIVERY")} icon={<Bike className="h-6 w-6" />} title="Entrega" subtitle={`~${prepTimeMin} min`} />
            <ChoiceTile active={form.type === "PICKUP"} onClick={() => set("type", "PICKUP")} icon={<Store className="h-6 w-6" />} title="Retirada" subtitle="Sem taxa" />
          </div>

          {form.type === "DELIVERY" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-6">
              {user && user.addresses.length > 0 && (
                <Field label="Endereço salvo" className="sm:col-span-6">
                  <Select
                    defaultValue={firstAddress?.id}
                    onChange={(e) => {
                      const a = user.addresses.find((x) => x.id === Number(e.target.value));
                      if (a) setForm((f) => ({ ...f, street: a.street, number: a.number, complement: a.complement, reference: a.reference, neighborhoodId: a.neighborhoodId }));
                      else setForm((f) => ({ ...f, street: "", number: "", complement: "", reference: "", neighborhoodId: 0 }));
                    }}
                  >
                    {user.addresses.map((a) => (
                      <option key={a.id} value={a.id}>{a.label} — {a.street}, {a.number}</option>
                    ))}
                    <option value="0">Outro endereço</option>
                  </Select>
                </Field>
              )}
              <Field label="Rua" className="sm:col-span-4">
                <Input required autoComplete="address-line1" value={form.street} onChange={(e) => set("street", e.target.value)} />
              </Field>
              <Field label="Número" className="sm:col-span-2">
                <Input required value={form.number} onChange={(e) => set("number", e.target.value)} />
              </Field>
              <Field label="Bairro" className="sm:col-span-3">
                <Select required value={form.neighborhoodId || ""} onChange={(e) => set("neighborhoodId", Number(e.target.value))}>
                  <option value="">Selecione...</option>
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} — {formatMoney(n.fee)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Complemento" className="sm:col-span-3">
                <Input placeholder="Apto, bloco..." value={form.complement} onChange={(e) => set("complement", e.target.value)} />
              </Field>
              <Field label="Ponto de referência" className="sm:col-span-6">
                <Input value={form.reference} onChange={(e) => set("reference", e.target.value)} />
              </Field>
              {user && <Checkbox className="sm:col-span-6" label="Salvar este endereço na minha conta" checked={form.saveAddress} onChange={(e) => set("saveAddress", e.target.checked)} />}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-xl text-madeira-800">Pagamento</h2>
          <div className="grid grid-cols-3 gap-3">
            <ChoiceTile active={form.paymentMethod === "PIX"} onClick={() => set("paymentMethod", "PIX")} icon={<QrCode className="h-6 w-6" />} title="Pix" />
            <ChoiceTile active={form.paymentMethod === "CARD"} onClick={() => set("paymentMethod", "CARD")} icon={<CreditCard className="h-6 w-6" />} title="Cartão" subtitle="na entrega" />
            <ChoiceTile active={form.paymentMethod === "CASH"} onClick={() => set("paymentMethod", "CASH")} icon={<Banknote className="h-6 w-6" />} title="Dinheiro" />
          </div>
          {form.paymentMethod === "PIX" && <p className="mt-3 text-sm text-madeira-500">O QR Code e a chave Pix aparecem logo após confirmar o pedido.</p>}
          {form.paymentMethod === "CARD" && <p className="mt-3 text-sm text-madeira-500">Levamos a maquininha (crédito e débito).</p>}
          {form.paymentMethod === "CASH" && (
            <Field label="Troco para quanto?" hint="Deixe em branco se não precisar de troco." className="mt-4 max-w-xs">
              <Input inputMode="decimal" placeholder="Ex.: 100,00" value={form.changeFor} onChange={(e) => set("changeFor", e.target.value.replace(/[^\d,.]/g, ""))} />
            </Field>
          )}
        </Card>

        <Card className="p-5">
          <Field label="Observações do pedido">
            <Textarea maxLength={300} placeholder="Ex.: interfone quebrado, ligar ao chegar" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </Card>
      </div>

      {/* Resumo */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          <h2 className="mb-3 text-xl text-madeira-800">Resumo</h2>
          <ul className="divide-y divide-madeira-100 text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-3 py-2">
                <span>
                  <strong>{i.selection.quantity}x</strong> {i.name}
                  {i.details.length > 0 && <span className="block text-xs text-madeira-500">{i.details.join(" · ")}</span>}
                </span>
                <span className="font-semibold whitespace-nowrap">{formatMoney(i.unitPrice * i.selection.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            {couponState ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {couponState.code} aplicado</span>
                <button type="button" onClick={removeCoupon} aria-label="Remover cupom"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Cupom de desconto" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} />
                <Button variant="outline" className="shrink-0" disabled={!couponInput || pending} onClick={() => applyCoupon()}>Aplicar</Button>
              </div>
            )}
            {couponError && <p className="mt-1 text-xs text-brasa-700">{couponError}</p>}
          </div>

          <dl className="mt-4 space-y-1 text-sm">
            <Row label="Subtotal" value={formatMoney(subtotal)} />
            {form.type === "DELIVERY" && <Row label="Taxa de entrega" value={neighborhood ? formatMoney(fee) : "Escolha o bairro"} />}
            {discount > 0 && <Row label="Desconto" value={`- ${formatMoney(discount)}`} className="text-emerald-700" />}
            <Row label="Total" value={formatMoney(total)} className="border-t border-madeira-100 pt-2 text-lg font-extrabold" />
          </dl>

          {belowMinimum && (
            <p className="mt-3 rounded-lg bg-milho-300/40 p-2 text-xs text-madeira-800">
              Pedido mínimo para entrega: {formatMoney(minOrder)}. Faltam {formatMoney(minOrder - subtotal)}.
            </p>
          )}

          <Button type="submit" size="lg" className="mt-4 w-full" disabled={pending || belowMinimum}>
            {pending ? "Enviando..." : `Confirmar pedido • ${formatMoney(total)}`}
          </Button>
          <Link href="/cardapio" className="mt-3 block text-center text-sm font-semibold text-madeira-600 hover:underline">Adicionar mais itens</Link>
        </Card>
      </aside>
    </form>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ChoiceTile({ active, onClick, icon, title, subtitle }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition",
        active ? "border-brasa-600 bg-brasa-50 text-brasa-700" : "border-madeira-100 bg-white text-madeira-600 hover:border-madeira-200",
      )}
    >
      {icon}
      <span className="text-sm font-bold">{title}</span>
      {subtitle && <span className="text-xs text-madeira-400">{subtitle}</span>}
    </button>
  );
}
