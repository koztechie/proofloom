"use server";

import { auth } from "@/lib/auth";
import { createChallenge } from "@/lib/db/challenges";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALLOWED_CATEGORIES = [
  "SQL",
  "Python",
  "JavaScript",
  "Web Dev",
  "Writing",
  "Design",
  "Fitness",
  "Other",
];

export async function createChallengeAction(
  prevState: any,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const skillCategory = formData.get("skillCategory") as string;
  const targetDaysStr = formData.get("targetDays") as string;
  const isPublicStr = formData.get("isPublic") as string;

  // 1. Валідація даних на стороні сервера
  if (!title || !skillCategory || !targetDaysStr) {
    return { error: "All fields are required." };
  }

  if (title.trim().length < 5) {
    return { error: "Title must be at least 5 characters long." };
  }

  if (!ALLOWED_CATEGORIES.includes(skillCategory)) {
    return { error: "Invalid skill category selected." };
  }

  const targetDays = parseInt(targetDaysStr, 10);
  if (isNaN(targetDays) || targetDays < 7 || targetDays > 365) {
    return { error: "Target days must be a number between 7 and 365." };
  }

  const isPublic = isPublicStr === "true";

  try {
    // 2. Запис у базу даних Aurora PostgreSQL
    await createChallenge(
      session.user.id,
      title.trim(),
      skillCategory,
      targetDays,
      isPublic,
    );
  } catch (error) {
    console.error("Create challenge error:", error);
    return { error: "Failed to save challenge to the database." };
  }

  // 3. Очищення кешу дашборду та редірект
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
