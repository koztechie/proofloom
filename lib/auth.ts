/**
 * lib/auth.ts
 *
 * NextAuth v5 configuration.
 *
 * Security guarantees:
 *  - Blocked accounts (is_active = false) are rejected at login time.
 *  - Role and isActive status are embedded in the JWT on sign-in and
 *    propagated to the Session object so guards can read them without extra
 *    DB round-trips.
 *  - The authorized() callback redirects with a callbackUrl so users land
 *    back on the protected page after successful login.
 */

import "@/types";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail, getUserByHandle } from "./db/users";
import { Role } from "@/lib/auth/roles";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Typed credentials error for blocked accounts
// ---------------------------------------------------------------------------
class AccountDisabledError extends CredentialsSignin {
  code = "account_disabled";
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

        // Automatically detect identifier type (email vs. handle)
        const user = identifier.includes("@")
          ? await getUserByEmail(identifier)
          : await getUserByHandle(identifier);

        if (!user) return null;

        // Block suspended / banned accounts before password verification
        if (user.is_active === false) {
          throw new AccountDisabledError(
            "Your account has been disabled. Contact support.",
          );
        }

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
          role: (user.role as Role) ?? Role.USER,
          isActive: user.is_active,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    /**
     * jwt — runs on sign-in (user is present) and on every token refresh.
     * Embeds role and isActive into the token on initial sign-in.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.handle = user.handle ?? "";
        // Cast through unknown because next-auth User is widened to include our extension
        token.role = (user.role as Role) ?? Role.USER;
        token.isActive = (user.isActive as boolean) ?? true;
      }
      return token;
    },

    /**
     * session — shapes the session object that is exposed to the client.
     * Only safe, non-sensitive fields are forwarded.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.handle = token.handle as string;
        session.user.role = (token.role as Role) ?? Role.USER;
        session.user.isActive = (token.isActive as boolean) ?? true;
      }
      return session;
    },

    /**
     * authorized — used by the proxy / middleware to gate protected routes.
     * Redirects to /auth/login with a callbackUrl pointing at the original URL.
     */
    authorized({ auth: session, request }) {
      const { pathname, search } = request.nextUrl;
      const callbackUrl = encodeURIComponent(pathname + search);

      if (!session) {
        const loginUrl = new URL(
          `/auth/login?callbackUrl=${callbackUrl}`,
          request.url,
        );
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});
