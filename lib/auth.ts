import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail, getUserByHandle } from "./db/users";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      handle: string;
    } & DefaultSession["user"];
  }
  interface User {
    handle?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const identifier = credentials.email as string;

        // Антикрихкість: автоматично визначаємо тип ідентифікатора
        const user = identifier.includes("@")
          ? await getUserByEmail(identifier)
          : await getUserByHandle(identifier);

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          handle: user.handle,
          name: user.display_name,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // Коллбек авторизації для проксі-роутера (proxy.ts)
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Визначаємо перелік закритих роутів
      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/challenge") ||
        pathname.startsWith("/api/challenges") ||
        pathname.startsWith("/api/proofs");

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Примусовий автоматичний редирект на /auth/login
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.handle = user.handle;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.handle = token.handle as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});
