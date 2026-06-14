export { auth as proxy } from "@/lib/auth";

// Обмежуємо роботу проксі лише приватними роутами
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/challenge/:path*",
    "/api/challenges/:path*",
    "/api/proofs/:path*",
    "/settings/:path*", // ДОДАНО
  ],
};
