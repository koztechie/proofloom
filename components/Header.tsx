import Link from "next/link";
import { auth } from "@/lib/auth";
import Logo from "./logo"; // Наш чистий логотип
import UserMenu from "./UserMenu";

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Logo />
        <nav className="hidden md:flex space-x-6 text-sm font-medium text-zinc-400">
          {/* Публічні лінки для всіх */}
          <Link
            href="/leaderboard"
            className="hover:text-zinc-200 transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/pricing"
            className="hover:text-zinc-200 transition-colors"
          >
            Pricing
          </Link>
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        {session?.user ? (
          // Якщо залогінений — показуємо лише хендл із меню
          <UserMenu handle={session.user.handle} />
        ) : (
          // Якщо не залогінений — показуємо кнопки входу
          <>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-semibold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 transition-colors"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
