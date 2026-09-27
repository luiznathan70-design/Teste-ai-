import { getSettings } from "@/lib/catalog";
import { saveSettings } from "@/actions/admin/business";
import { centsToInput } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { AdminForm } from "@/components/admin/admin-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader title="Configurações gerais" />
      <AdminForm action={saveSettings} submitLabel="Salvar configurações">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4 p-5">
            <h2 className="text-lg text-madeira-800">Restaurante</h2>
            <Field label="Nome"><Input name="name" required defaultValue={s.name} /></Field>
            <Field label="Slogan"><Input name="slogan" defaultValue={s.slogan} /></Field>
            <Field label="Logo" hint="Opcional. Sem logo, usamos o logotipo em texto."><ImageUpload name="logoUrl" defaultValue={s.logoUrl} /></Field>
            <Field label="Texto da página Sobre" hint="Separe parágrafos com linha em branco."><Textarea name="aboutText" rows={6} defaultValue={s.aboutText} /></Field>
          </Card>
          <div className="space-y-6">
            <Card className="space-y-4 p-5">
              <h2 className="text-lg text-madeira-800">Contato e endereço</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Telefone (exibição)"><Input name="phone" defaultValue={s.phone} placeholder="(00) 0000-0000" /></Field>
                <Field label="WhatsApp" hint="Com DDI e DDD: 5511999999999"><Input name="whatsapp" defaultValue={s.whatsapp} inputMode="numeric" /></Field>
                <Field label="E-mail"><Input name="email" type="email" defaultValue={s.email ?? ""} /></Field>
                <Field label="Instagram"><Input name="instagram" defaultValue={s.instagram ?? ""} placeholder="@ranchospizzaria" /></Field>
              </div>
              <Field label="Endereço"><Input name="address" defaultValue={s.address} /></Field>
              <Field label="Cidade / UF"><Input name="city" defaultValue={s.city} /></Field>
            </Card>
            <Card className="space-y-4 p-5">
              <h2 className="text-lg text-madeira-800">Pedidos e Pix</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Chave Pix"><Input name="pixKey" defaultValue={s.pixKey} placeholder="CNPJ, e-mail, telefone ou aleatória" /></Field>
                <Field label="Nome do recebedor Pix" hint="Até 25 caracteres"><Input name="pixMerchant" maxLength={25} defaultValue={s.pixMerchant} /></Field>
                <Field label="Pedido mínimo p/ entrega (R$)"><Input name="minOrder" inputMode="decimal" defaultValue={centsToInput(s.minOrder)} /></Field>
                <Field label="Tempo estimado (min)"><Input name="prepTimeMin" type="number" min={5} defaultValue={s.prepTimeMin} /></Field>
              </div>
            </Card>
          </div>
        </div>
      </AdminForm>
    </>
  );
}
