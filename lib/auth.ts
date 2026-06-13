import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail } from "./db/users";
import bcrypt from "bcryptjs";

// Аугментація: вчимо TypeScript розуміти наші кастомні поля id та handle
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
        // Базовий захист від порожніх запитів
        if (!credentials?.email || !credentials?.password) return null;

        const user = await getUserByEmail(credentials.email as string);
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
    // Переносимо дані з БД у зашифрований токен
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.handle = user.handle;
      }
      return token;
    },
    // Переносимо дані з токена у сесію для фронтенду
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
