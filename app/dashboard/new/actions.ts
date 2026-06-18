"use server";

/**
 * app/dashboard/new/actions.ts
 *
 * Server Action for creating a new challenge.
 * Validates FormData against ChallengeCreateSchema before any DB write.
 */

import { requireAuth, UnauthorizedError } from "@/lib/auth/guards";
import { createChallenge } from "@/lib/db/challenges";
import { ChallengeCreateSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createChallengeAction(
  prevState: unknown,
  formData: FormData,
) {
  // ── 1. Authentication ────────────────────────────────────────────────────
  let userId: string;
  try {
    const user = await requireAuth({ redirectOnFailure: false });
    userId = user.id;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { error: "You must be logged in to create a challenge." };
    }
    throw err;
  }

  // ── 2. Zod schema validation ─────────────────────────────────────────────
  const raw = {
    title: formData.get("title"),
    skillCategory: formData.get("skillCategory"),
    // targetDays arrives as a string from FormData; coerce to number for Zod
    targetDays: Number(formData.get("targetDays")),
  };

  const parsed = ChallengeCreateSchema.safeParse(raw);
  if (!parsed.success) {
    // Return the first validation error as a user-friendly message.
    const firstIssue = parsed.error.issues[0];
    return {
      error: firstIssue?.message ?? "Invalid challenge data.",
    };
  }

  const { title, skillCategory, targetDays } = parsed.data;

  // isPublic is a checkbox — defaults to true if not explicitly set to "false"
  const isPublic = formData.get("isPublic") !== "false";

  // ── 3. Database write ────────────────────────────────────────────────────
  try {
    await createChallenge(userId, title.trim(), skillCategory, targetDays, isPublic);
  } catch (error) {
    console.error("Create challenge error:", error);
    return { error: "Failed to save challenge to the database." };
  }

  // ── 4. Cache invalidation & redirect ────────────────────────────────────
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
