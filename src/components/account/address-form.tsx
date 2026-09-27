"use client";

import { useActionState, useState } from "react";
import { addAddressAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";

export function AddressForm({ neighborhoods }: { neighborhoods: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addAddressAction, undefined);
  if (!open) return <Button variant="outline" className="mt-4 w-full" onClick={() => setOpen(true)}>+ Novo endereço</Button>;
  return (
    <form action={action} className="mt-4 grid gap-3" key={state?.success}>
      {state?.error && <p className="text-sm text-brasa-700">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
      <Field label="Apelido"><Input name="label" defaultValue="Casa" /></Field>
      <Field label="Rua"><Input name="street" required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Número"><Input name="number" required /></Field>
        <Field label="Complemento"><Input name="complement" /></Field>
      </div>
      <Field label="Bairro">
        <Select name="neighborhoodId" required defaultValue="">
          <option value="">Selecione...</option>
          {neighborhoods.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </Select>
      </Field>
      <Field label="Referência"><Input name="reference" /></Field>
      <Button type="submit" disabled={pending}>Salvar endereço</Button>
    </form>
  );
}
