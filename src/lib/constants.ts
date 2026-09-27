// Valores válidos para os campos "enum" do banco (String no Prisma).

export const SECTORS = ["PIZZARIA", "LANCHES", "ALMOCO", "CHURRASCO", "BEBIDAS", "SOBREMESAS"] as const;
export type Sector = (typeof SECTORS)[number];

export const SECTOR_LABELS: Record<Sector, string> = {
  PIZZARIA: "Pizzaria",
  LANCHES: "Lanches",
  ALMOCO: "Almoço",
  CHURRASCO: "Churrasco",
  BEBIDAS: "Bebidas",
  SOBREMESAS: "Sobremesas",
};

export const PRODUCT_KINDS = ["SIMPLE", "PIZZA", "VARIANT"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

export const PRODUCT_KIND_LABELS: Record<ProductKind, string> = {
  SIMPLE: "Preço único",
  PIZZA: "Sabor de pizza (preço por tamanho)",
  VARIANT: "Com variações (P/M/G, 500g/1kg...)",
};

export const ORDER_STATUSES = [
  "RECEBIDO",
  "EM_PREPARO",
  "SAIU_PARA_ENTREGA",
  "PRONTO_RETIRADA",
  "ENTREGUE",
  "CANCELADO",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEBIDO: "Recebido",
  EM_PREPARO: "Em preparo",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  PRONTO_RETIRADA: "Pronto para retirada",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

/** Sequência de status exibida ao cliente, conforme o tipo de pedido. */
export function statusFlow(type: string): OrderStatus[] {
  return type === "PICKUP"
    ? ["RECEBIDO", "EM_PREPARO", "PRONTO_RETIRADA", "ENTREGUE"]
    : ["RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA", "ENTREGUE"];
}

/** Próximo status do fluxo (usado nos botões do kanban). */
export function nextStatus(type: string, current: string): OrderStatus | null {
  const flow = statusFlow(type);
  const i = flow.indexOf(current as OrderStatus);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
}

export const PAYMENT_METHODS = ["PIX", "CARD", "CASH"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  PIX: "Pix",
  CARD: "Cartão na entrega",
  CASH: "Dinheiro",
};

export const ORDER_TYPES = ["DELIVERY", "PICKUP"] as const;
export const ORDER_TYPE_LABELS: Record<string, string> = { DELIVERY: "Entrega", PICKUP: "Retirada" };

export const DAILY_SECTIONS = ["PRATOS", "GUARNICOES", "SALADAS", "SOBREMESAS"] as const;
export const DAILY_SECTION_LABELS: Record<string, string> = {
  PRATOS: "Pratos principais",
  GUARNICOES: "Guarnições",
  SALADAS: "Saladas",
  SOBREMESAS: "Sobremesas",
};

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const TIMEZONE = "America/Sao_Paulo";
