/**
 * types/auth.ts
 *
 * Module augmentations for next-auth — extends the default Session, User, and
 * JWT interfaces to include the application's custom fields.
 *
 * This file must be imported once at the top of your NextAuth configuration
 * (lib/auth.ts already does `import "@/types"`).
 */

import { DefaultSession } from "next-auth";
import { Role } from "@/lib/auth/roles";

declare module "next-auth" {
  interface Session {
    user: {
      /** Internal UUID primary key. */
      id: string;
      /** Public @handle used across the application. */
      handle: string;
      /** The user's assigned role. */
      role: Role;
      /** Whether the account is currently active (not suspended/banned). */
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    handle?: string;
    role?: Role;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    handle?: string;
    role?: Role;
    isActive?: boolean;
  }
}

export {};
