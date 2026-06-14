"use server";

import { createUser, getUserByEmail, getUserByHandle } from "@/lib/db/users";
import { signIn } from "@/lib/auth";
import { isReservedHandle } from "@/lib/reservedWords";

export async function registerUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const handle = formData.get("handle") as string;
  const password = formData.get("password") as string;
  const displayName = (formData.get("displayName") as string) || undefined;

  if (!email || !handle || !password) {
    return { error: "Email, username, and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const handleRegex = /^[a-zA-Z0-9_]+$/;
  if (!handleRegex.test(handle)) {
    return {
      error: "Username can only contain letters, numbers, and underscores.",
    };
  }

  // Заборона використання системних та зарезервованих слів
  if (isReservedHandle(handle)) {
    return { error: "This username is reserved for system use." };
  }

  // 1. Блок роботи з базою даних (загортаємо в try-catch ТІЛЬКИ операції з Aurora PG)
  try {
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return { error: "This email is already registered." };
    }

    const existingHandle = await getUserByHandle(handle);
    if (existingHandle) {
      return { error: "This username is already taken." };
    }

    await createUser(handle, email, password, displayName);
  } catch (error: any) {
    console.error("Database Registration error:", error);
    return {
      error: `Database error: ${error.message || "Something went wrong."}`,
    };
  }

  // 2. Блок авторизації (викликаємо СТРОГО поза межами try-catch)
  // Next.js виконає внутрішній редірект NEXT_REDIRECT без перехоплення
  await signIn("credentials", {
    email,
    password,
    redirect: true,
    redirectTo: "/dashboard",
  });
}
