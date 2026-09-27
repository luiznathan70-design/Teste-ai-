"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth, signIn, signOut } from "@/auth";

export type FormState = { error?: string; success?: string } | undefined;

/** Evita redirecionamento para outros domínios */
function safeRedirect(url: FormDataEntryValue | null, fallback: string) {
  const v = typeof url === "string" ? url : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").toLowerCase(),
      password: String(formData.get("password") ?? ""),
      redirectTo: safeRedirect(formData.get("callbackUrl"), "/conta"),
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "E-mail ou senha incorretos." };
    throw e; // o redirect do Next é lançado como exceção
  }
}

export async function adminLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const user = await db.user.findUnique({ where: { email }, select: { role: true } });
  if (user && user.role !== "ADMIN") return { error: "Este usuário não tem acesso ao painel." };
  try {
    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirectTo: safeRedirect(formData.get("callbackUrl"), "/admin"),
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "E-mail ou senha incorretos." };
    throw e;
  }
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  phone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, phone, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Já existe uma conta com este e-mail." };
  await db.user.create({ data: { name, email, phone, passwordHash: await bcrypt.hash(password, 10), role: "CUSTOMER" } });
  await signIn("credentials", { email, password, redirectTo: safeRedirect(formData.get("callbackUrl"), "/conta") });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

const addressSchema = z.object({
  label: z.string().trim().min(1).default("Casa"),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  neighborhoodId: z.coerce.number().int().positive("Escolha o bairro."),
});

export async function addAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login novamente." };
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.address.create({ data: { ...parsed.data, userId: Number(session.user.id) } });
  revalidatePath("/conta");
  return { success: "Endereço salvo." };
}

export async function deleteAddressAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;
  await db.address.deleteMany({ where: { id: Number(formData.get("id")), userId: Number(session.user.id) } });
  revalidatePath("/conta");
}
