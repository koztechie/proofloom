"use server";

import { signIn } from "@/lib/auth";

export async function loginUser(prevState: unknown, formData: FormData) {
  const identifier = formData.get("identifier") as string; // Email or username
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Email/Username and password are required." };
  }

  try {
    await signIn("credentials", {
      email: identifier, // NextAuth maps the identifier onto the email credential field
      password,
      redirect: true,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    // next-auth v4: redirect errors are plain Error instances re-thrown by signIn.
    // Non-redirect errors indicate a bad credentials or auth failure.
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("credentialssignin") || msg.includes("invalid")) {
        return { error: "Invalid email, username, or password." };
      }
      // Re-throw redirect errors so Next.js can perform the navigation
      if (msg.includes("redirect")) throw error;
      return { error: "Authentication failed. Please try again." };
    }
    throw error;
  }
}
