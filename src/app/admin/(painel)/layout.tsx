import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/lib/catalog";
import { logoutAction } from "@/actions/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // O middleware já protege, mas conferimos também no servidor
  if (session?.user?.role !== "ADMIN") redirect("/admin/login");
  const settings = await getSettings();
  return (
    <div className="min-h-dvh bg-creme-50 lg:flex">
      <AdminSidebar name={settings.name} userName={session.user.name ?? "admin"} logout={logoutAction} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
