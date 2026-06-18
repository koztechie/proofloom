/**
 * lib/validation/schemas.ts
 *
 * Application-wide Zod v4 validation schemas.
 * All schemas are exported alongside their inferred TypeScript types.
 *
 * Zod v4 notes used here:
 *  - Top-level format helpers: z.email(), z.uuid(), z.url()
 *  - Unified `error` param instead of legacy `message`
 *  - z.infer<typeof Schema> for type extraction
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared constants (single source of truth — kept in sync with actions.ts)
// ---------------------------------------------------------------------------

export const ALLOWED_SKILL_CATEGORIES = [
  "SQL",
  "Python",
  "JavaScript",
  "Web Dev",
  "Writing",
  "Design",
  "Fitness",
  "Other",
] as const;

// ---------------------------------------------------------------------------
// UserRegistrationSchema
// ---------------------------------------------------------------------------

export const UserRegistrationSchema = z.object({
  handle: z
    .string()
    .regex(/^[a-zA-Z0-9_]{3,30}$/, {
      error:
        "Handle must be 3–30 characters and contain only letters, numbers, or underscores.",
    }),
  email: z.email({ error: "A valid email address is required." }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long." }),
  displayName: z.string().max(80).optional(),
});

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;

// ---------------------------------------------------------------------------
// ChallengeCreateSchema
// ---------------------------------------------------------------------------

export const ChallengeCreateSchema = z.object({
  title: z
    .string()
    .min(3, { error: "Title must be at least 3 characters long." })
    .max(100, { error: "Title cannot exceed 100 characters." }),
  skillCategory: z.enum(ALLOWED_SKILL_CATEGORIES, {
    error: `Skill category must be one of: ${ALLOWED_SKILL_CATEGORIES.join(", ")}.`,
  }),
  targetDays: z
    .int({ error: "Target days must be a whole number." })
    .min(7, { error: "Target days must be at least 7." })
    .max(365, { error: "Target days cannot exceed 365." }),
});

export type ChallengeCreateInput = z.infer<typeof ChallengeCreateSchema>;

// ---------------------------------------------------------------------------
// ProofSubmitSchema
// ---------------------------------------------------------------------------

export const ProofSubmitSchema = z.object({
  challengeId: z.uuid({ error: "A valid challenge UUID is required." }),
  proofText: z
    .string()
    .min(50, {
      error:
        "Proof text must be at least 50 characters — demonstrate real effort!",
    })
    .max(5000, { error: "Proof text cannot exceed 5 000 characters." }),
  proofUrl: z.url({ error: "Proof URL must be a valid URL." }).optional(),
});

export type ProofSubmitInput = z.infer<typeof ProofSubmitSchema>;

// ---------------------------------------------------------------------------
// WeeklyReportGenerateSchema
// ---------------------------------------------------------------------------

export const WeeklyReportGenerateSchema = z.object({
  challengeId: z.uuid({ error: "A valid challenge UUID is required." }),
});

export type WeeklyReportGenerateInput = z.infer<
  typeof WeeklyReportGenerateSchema
>;
