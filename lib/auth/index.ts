/**
 * lib/auth/index.ts
 *
 * Barrel re-export for the auth sub-package.
 * Import guards and roles from here: `import { requireAuth, Role } from "@/lib/auth/guards"`.
 */

export * from "./roles";
export * from "./guards";
