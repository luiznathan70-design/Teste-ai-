import { z } from "zod";

const selectionSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99),
  sizeId: z.number().int().optional(),
  flavorIds: z.array(z.number().int()).max(3).optional(),
  crustId: z.number().int().nullable().optional(),
  variantId: z.number().int().optional(),
  addonIds: z.array(z.number().int()).max(20).optional(),
  notes: z.string().max(200).optional(),
});

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Informe seu nome."),
    customerPhone: z
      .string()
      .trim()
      .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD."),
    type: z.enum(["DELIVERY", "PICKUP"]),
    street: z.string().trim().optional(),
    number: z.string().trim().optional(),
    complement: z.string().trim().optional(),
    reference: z.string().trim().optional(),
    neighborhoodId: z.number().int().optional(),
    paymentMethod: z.enum(["PIX", "CARD", "CASH"]),
    changeFor: z.number().int().nonnegative().optional(),
    couponCode: z.string().trim().optional(),
    notes: z.string().trim().max(300).optional(),
    saveAddress: z.boolean().optional(),
    items: z.array(selectionSchema).min(1, "Seu carrinho está vazio."),
  })
  .superRefine((v, ctx) => {
    if (v.type === "DELIVERY") {
      if (!v.street) ctx.addIssue({ code: "custom", path: ["street"], message: "Informe a rua." });
      if (!v.number) ctx.addIssue({ code: "custom", path: ["number"], message: "Informe o número." });
      if (!v.neighborhoodId) ctx.addIssue({ code: "custom", path: ["neighborhoodId"], message: "Escolha o bairro." });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
