"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface MobileNavigationProps {
  isLoggedIn: boolean;
  handle?: string;
}

export default function MobileNavigation({
  isLoggedIn,
  handle,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Кнопка-гамбургер з анімованою SVG-іконкою [45] */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-400 hover:text-zinc-100 focus:outline-none"
        aria-label="Toggle mobile menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 16h16"
            />
          )}
        </svg>
      </button>

      {/* Мобільне випадаюче меню [45] */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-zinc-950 border-b border-zinc-800 p-6 flex flex-col space-y-4 shadow-2xl z-40 animate-in fade-in slide-in-from-top-5 duration-200">
          <Link
            href="/leaderboard"
            onClick={() => setIsOpen(false)}
            className="text-zinc-300 hover:text-emerald-400 font-semibold text-sm py-2"
          >
            Leaderboard
          </Link>
          <Link
            href="/pricing"
            onClick={() => setIsOpen(false)}
            className="text-zinc-300 hover:text-emerald-400 font-semibold text-sm py-2"
          >
            Pricing
          </Link>

          {isLoggedIn && handle ? (
            <>
              <div className="border-t border-zinc-800 my-2"></div>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="text-zinc-300 hover:text-emerald-400 font-semibold text-sm py-2"
              >
                Dashboard
              </Link>
              <Link
                href={`/u/${handle}`}
                onClick={() => setIsOpen(false)}
                className="text-zinc-300 hover:text-emerald-400 font-semibold text-sm py-2"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="text-zinc-300 hover:text-emerald-400 font-semibold text-sm py-2"
              >
                Settings
              </Link>
              <div className="border-t border-zinc-800 my-2"></div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full text-left text-sm text-red-400 font-semibold py-2"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="border-t border-zinc-800 my-2"></div>
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="text-zinc-300 hover:text-emerald-400 font-semibold text-sm py-2"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setIsOpen(false)}
                className="text-center rounded-lg bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
