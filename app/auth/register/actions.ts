"use server";

import { createUser, getUserByEmail, getUserByHandle } from "@/lib/db/users";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function registerUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const handle = formData.get("handle") as string;
  const password = formData.get("password") as string;
  const displayName = (formData.get("displayName") as string) || undefined;

  // 1. Валідація заповнення обов'язкових полів
  if (!email || !handle || !password) {
    return { error: "Email, username, and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  // Валідація юзернейму (допускаємо лише латиницю, цифри та підкреслення)
  const handleRegex = /^[a-zA-Z0-9_]+$/;
  if (!handleRegex.test(handle)) {
    return {
      error: "Username can only contain letters, numbers, and underscores.",
    };
  }

  try {
    // 2. Перевірка на унікальність пошти
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return { error: "This email is already registered." };
    }

    // 3. Перевірка на унікальність юзернейму
    const existingHandle = await getUserByHandle(handle);
    if (existingHandle) {
      return { error: "This username is already taken." };
    }

    // 4. Створення користувача в базі Aurora PostgreSQL
    await createUser(handle, email, password, displayName);

    // 5. Автоматичний вхід у систему після створення акаунту
    await signIn("credentials", {
      email,
      password,
      redirect: true,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // КРИТИЧНО ДЛЯ NEXTAUTH: Редирект у Server Actions працює через викидання спеціальної помилки.
      // Ми маємо прокинути її далі, інакше редирект на /dashboard зламається.
      throw error;
    }
    console.error("Registration error:", error);
    return { error: "Something went wrong during registration." };
  }
}
