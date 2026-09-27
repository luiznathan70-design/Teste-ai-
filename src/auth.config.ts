import type { NextAuthConfig } from "next-auth";

/**
 * Configuração do NextAuth compatível com o Edge (usada pelo middleware).
 * Não importa Prisma nem bcrypt — o provedor de credenciais fica em auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/conta/entrar" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const role = auth?.user?.role;
      if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
        if (role === "ADMIN") return true;
        return Response.redirect(new URL(`/admin/login?callbackUrl=${encodeURIComponent(path)}`, request.nextUrl));
      }
      if (path === "/conta" || path.startsWith("/conta/enderecos") || path.startsWith("/conta/pedidos")) {
        return !!auth?.user;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
