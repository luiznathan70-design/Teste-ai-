# 🍕 Ranchos Pizzaria

Sistema web completo da **Ranchos Pizzaria**: site institucional, cardápio e pedidos online, e painel administrativo.
Pizzaria, lanches, almoço self-service e churrasco em um só lugar, mobile-first e em português do Brasil.

## Stack

- **Next.js 15** (App Router, Server Components e Server Actions) + **TypeScript**
- **Tailwind CSS 4** com tema rústico próprio (brasa, madeira, creme e milho)
- **Prisma 6** com **SQLite** no desenvolvimento (pronto para **PostgreSQL** em produção)
- **NextAuth (Auth.js v5)** com login por e-mail e senha (admin e clientes)
- **Zustand** (carrinho salvo no navegador), **Zod** (validação), **Recharts** (gráficos), **qrcode** (Pix)

## Funcionalidades

**Site público**
- Página inicial com hero, as 4 frentes (com status aberto/fechado), promoções, destaques, depoimentos, horários e mapa
- Cardápio com abas por setor, busca sem acento e filtros (disponíveis agora, destaques, vegetariano, picante, doce)
- Horários por setor: fora do horário o item aparece como **“Indisponível agora”** e o checkout bloqueia
- Cardápio do dia do self-service, páginas Sobre e Contato, botão flutuante do WhatsApp

**Pedidos**
- Personalização: tamanho, **meio a meio** (2 ou 3 sabores conforme o tamanho, cobrando o sabor mais caro), borda recheada, variações (marmitex P/M/G, 500g/1kg...), adicionais e observações
- Checkout com entrega (taxa por bairro e pedido mínimo) ou retirada
- Pagamento: **Pix** (QR Code + copia e cola gerados com o valor exato), cartão na entrega ou dinheiro com “troco para”
- Cupons de desconto (percentual ou valor fixo, mínimo, validade, limite de usos)
- Pedido sem cadastro ou com conta (endereços salvos e histórico)
- Página de acompanhamento que atualiza sozinha: Recebido → Em preparo → Saiu para entrega / Pronto para retirada → Entregue
- Resumo do pedido enviado pelo WhatsApp com um clique
- **Todos os preços são recalculados no servidor**: o valor enviado pelo navegador nunca é usado

**Painel administrativo** (`/admin`)
- Dashboard: pedidos do dia, faturamento, ticket médio, gráfico de 7 dias, vendas por setor e itens mais vendidos
- Pedidos em tempo real em kanban (atualiza a cada 5s), **alerta sonoro** de novo pedido, **comanda para impressora 80mm**, confirmação de pagamento e WhatsApp do cliente
- CRUD de produtos (com upload de foto e botão de pausar), categorias, tamanhos, sabores, bordas e adicionais
- Editor do cardápio do dia, bairros e taxas, horários por setor (até 2 turnos por dia), cupons, promoções e depoimentos
- Lista de clientes (agrupados pelo telefone, com ou sem cadastro)
- Configurações gerais: nome, logo, telefone, WhatsApp, endereço, chave Pix, pedido mínimo e tempo estimado

## Rodando localmente

Pré-requisito: **Node.js 20+**.

```bash
npm install
cp .env.example .env          # ajuste AUTH_SECRET (ex.: npx auth secret)
npx prisma migrate dev        # cria o banco SQLite e roda o seed automaticamente
npm run dev
```

Acesse:
- Site: http://localhost:3000
- Painel: http://localhost:3000/admin

### Usuários de teste

| Perfil  | E-mail              | Senha        |
|---------|---------------------|--------------|
| Admin   | `admin@ranchos.com` | `admin123`   |
| Cliente | `cliente@teste.com` | `cliente123` |

> Troque a senha do admin antes de ir para produção (crie outro admin e remova o de teste).

### Scripts úteis

| Comando              | O que faz                                           |
|----------------------|-----------------------------------------------------|
| `npm run dev`        | Servidor de desenvolvimento                         |
| `npm run build`      | Gera o Prisma Client e o build de produção          |
| `npm run lint`       | ESLint                                              |
| `npm run typecheck`  | Checagem de tipos                                   |
| `npm run db:seed`    | Recria os dados de exemplo (**apaga os dados atuais**) |
| `npm run db:reset`   | Zera o banco, reaplica as migrations e roda o seed  |

### Horários e o cardápio

Os horários de exemplo seguem o fuso **America/Sao_Paulo**: almoço 11h–14h30, churrasco no almoço (e à noite no fim de semana), pizzaria e lanches das 18h às 23h30 (00h30 sexta e sábado), fechados às segundas à noite. Se estiver testando fora desses horários, os itens aparecem como “Indisponível agora”; ajuste em **Painel → Horários**.

## Primeiros ajustes (dados do restaurante)

O seed usa marcadores que devem ser trocados em **Painel → Configurações**:

- Endereço `[ENDEREÇO]`, cidade `[CIDADE]` e telefone `[TELEFONE]`
- WhatsApp (só dígitos com DDI e DDD, ex.: `5511999999999`)
- Chave Pix e nome do recebedor
- Fotos: os produtos usam imagens do Unsplash como placeholder. Envie as fotos reais pelo painel (se alguma imagem falhar, o site mostra um bloco com a identidade visual no lugar)

## Deploy na Vercel

SQLite não funciona na Vercel (o sistema de arquivos é somente leitura), então em produção use PostgreSQL.

1. **Crie um banco PostgreSQL** (Neon, Supabase, Vercel Postgres/Marketplace etc.) e copie a URL de conexão.
2. **Troque o provider** em `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. **Recrie as migrations para PostgreSQL** (as atuais são de SQLite):
   ```bash
   rm -rf prisma/migrations
   DATABASE_URL="postgresql://..." npx prisma migrate dev --name init
   ```
   Isso cria as tabelas no banco e roda o seed. Faça commit da nova pasta `prisma/migrations`.
4. **Importe o repositório na Vercel** e configure as variáveis de ambiente:
   - `DATABASE_URL`: URL do PostgreSQL
   - `AUTH_SECRET`: gere com `npx auth secret`
   - `BLOB_READ_WRITE_TOKEN`: crie um **Vercel Blob Store** no projeto (aba Storage) para o upload de imagens funcionar
5. **Build command** (Settings → Build): `prisma migrate deploy && npm run build`, para aplicar migrations novas a cada deploy.

Pronto. A Vercel detecta o Next.js automaticamente.

## Estrutura de pastas

```
prisma/
  schema.prisma          # modelo de dados (valores em centavos)
  seed.ts                # cardápio de exemplo, horários, bairros, cupons, admin
src/
  app/
    (site)/              # site público: home, cardápio, cardápio do dia, sobre, contato,
                         # checkout, pedido/[codigo] (acompanhamento), conta
    admin/
      login/             # login do painel
      comanda/[id]/      # comanda para impressão
      (painel)/          # telas do painel (layout com menu lateral)
    api/                 # auth, upload, status do pedido, pedidos do kanban
  actions/               # Server Actions (checkout, conta, painel)
  components/
    ui/                  # botões, campos, cards, modal, imagem com fallback
    site/ menu/ cart/ checkout/ order/ account/ admin/
  lib/
    pricing.ts           # regras de preço (meio a meio, borda, adicionais, cupom)
    hours.ts             # "aberto agora?" por setor, com fuso de São Paulo
    pix.ts               # gera o BR Code do Pix (copia e cola) com CRC16
    whatsapp.ts          # links e mensagem do pedido
    catalog.ts           # carrega o cardápio do banco
  store/cart.ts          # carrinho (Zustand + localStorage)
  auth.ts, auth.config.ts, middleware.ts   # autenticação e proteção de rotas
```

## Decisões de projeto

- **Dinheiro em centavos (inteiros)** em todo o sistema, sem erros de arredondamento.
- **Meio a meio cobra o sabor mais caro**, o padrão das pizzarias. A regra está em `src/lib/pricing.ts`.
- **Itens do pedido guardam uma cópia** do nome, preço e opções, então editar o cardápio não altera pedidos antigos.
- **Tempo real por polling** (5s no painel, 10s para o cliente): funciona na Vercel sem servidor de WebSocket. Para push de verdade, dá para trocar por Pusher ou Ably.
- **Pix estático com valor**: o QR já sai com o valor e o código do pedido; a confirmação do pagamento é manual no painel. Integrar um PSP (Mercado Pago, Efí, Asaas) é um próximo passo natural.
