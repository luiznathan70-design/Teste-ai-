"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/whatsapp";

/** Formulário de contato que abre o WhatsApp com a mensagem pronta (sem backend de e-mail) */
export function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const text = `Olá! Meu nome é ${name}.\n\n${message}`;
        window.open(whatsappLink(whatsapp, text), "_blank", "noopener");
      }}
    >
      <Field label="Seu nome">
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Mensagem">
        <Textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Como podemos ajudar?" />
      </Field>
      <div>
        <Button type="submit" size="lg">Enviar pelo WhatsApp</Button>
      </div>
    </form>
  );
}
