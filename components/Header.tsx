import Link from "next/link";
import { auth } from "@/lib/auth";
import Logo from "@/components/shared/logo";
import UserMenu from "@/components/features/auth/UserMenu";
import NotificationBell from "@/components/features/notifications/NotificationBell";

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        {/* Клікабельний логотип разом із назвою бренду */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <Logo />
          <span className="text-xl font-bold tracking-tight text-emerald-500 transition-colors group-hover:text-emerald-400">
            ProofLoom
          </span>
        </Link>

        <nav className="hidden md:flex space-x-6 text-sm font-medium text-zinc-400">
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
          <>
            <NotificationBell />
            <UserMenu handle={session.user.handle} />
          </>
        ) : (
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
