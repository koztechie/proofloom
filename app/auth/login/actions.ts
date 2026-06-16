"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginUser(prevState: any, formData: FormData) {
  const identifier = formData.get("identifier") as string; // Пошта або юзернейм
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Email/Username and password are required." };
  }

  try {
    await signIn("credentials", {
      email: identifier, // Мапимо ідентифікатор на поле email для NextAuth
      password,
      redirect: true,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email, username, or password." };
        default:
          return { error: "Authentication failed. Please try again." };
      }
    }
    throw error;
  }
}
