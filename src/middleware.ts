import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Protege /admin (somente ADMIN) e as páginas da conta do cliente.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/conta", "/conta/enderecos/:path*", "/conta/pedidos/:path*"],
};
