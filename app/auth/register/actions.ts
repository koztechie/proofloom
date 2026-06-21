"use server";

/**
 * app/auth/register/actions.ts
 *
 * Server Action for user registration.
 * Validates FormData against UserRegistrationSchema before any DB write.
 */

import { createUser, getUserByEmail, getUserByHandle } from "@/lib/db/users";
import { signIn } from "@/lib/auth";
import { isReservedHandle } from "@/lib/reservedWords";
import { UserRegistrationSchema } from "@/lib/validation/schemas";
import { sanitizeText } from "@/lib/security/sanitize";

export async function registerUser(prevState: unknown, formData: FormData) {
  // ── 1. Zod schema validation ─────────────────────────────────────────────
  const raw = {
    email: formData.get("email"),
    handle: formData.get("handle"),
    password: formData.get("password"),
    // displayName is optional — omit the key if empty to match schema's .optional()
    ...(formData.get("displayName")
      ? { displayName: formData.get("displayName") }
      : {}),
  };

  const parsed = UserRegistrationSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      error: firstIssue?.message ?? "Invalid registration data.",
    };
  }

  const { email, handle, password, displayName } = parsed.data;

  // ── 2. Domain-level guard: reserved handles ──────────────────────────────
  if (isReservedHandle(handle)) {
    return { error: "This username is reserved for system use." };
  }

  // ── 3. Uniqueness checks (DB round-trips — wrapped in try-catch) ─────────
  try {
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return { error: "This email is already registered." };
    }

    const existingHandle = await getUserByHandle(handle);
    if (existingHandle) {
      return { error: "This username is already taken." };
    }

    await createUser(handle, email, password, sanitizeText(displayName));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    console.error("Database registration error:", error);
    return { error: `Database error: ${message}` };
  }

  // ── 4. Auto sign-in after successful registration ────────────────────────
  // signIn() must be called OUTSIDE try-catch — Next.js throws a NEXT_REDIRECT
  // internally which must not be swallowed by a catch block.
  await signIn("credentials", {
    email,
    password,
    redirect: true,
    redirectTo: "/dashboard",
  });

  return { error: undefined };
}
