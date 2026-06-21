"use server";

import { auth } from "@/lib/auth";
import { updateUserProfile } from "@/lib/db/users";
import { revalidatePath } from "next/cache";
import { sanitizeText } from "@/lib/security/sanitize";

export async function updateProfileSettings(
  prevState: any,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const displayName = formData.get("displayName") as string;
  const bio = formData.get("bio") as string;
  const location = formData.get("location") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const twitterUrl = formData.get("twitterUrl") as string;
  const githubUrl = formData.get("githubUrl") as string;
  const linkedinUrl = formData.get("linkedinUrl") as string;
  const avatarType = formData.get("avatarType") as string;

  // Валідація URL (простий безпековий фільтр)
  const urlRegex =
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
  if (websiteUrl && !urlRegex.test(websiteUrl)) {
    return { error: "Invalid Website URL format." };
  }

  try {
    await updateUserProfile(session.user.id, {
      displayName: sanitizeText(displayName?.trim() || null),
      bio: sanitizeText(bio?.trim() || null),
      location: location?.trim() || null,
      websiteUrl: websiteUrl?.trim() || null,
      twitterUrl: twitterUrl?.trim() || null,
      githubUrl: githubUrl?.trim() || null,
      linkedinUrl: linkedinUrl?.trim() || null,
      avatarType: avatarType || "initials",
    });

    revalidatePath(`/u/${session.user.handle}`);
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Settings update error:", error);
    return { error: "Failed to update settings." };
  }
}
