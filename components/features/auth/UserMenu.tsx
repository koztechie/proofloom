"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function UserMenu({ handle }: { handle: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закриття меню при кліку поза ним
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-bold text-zinc-200 hover:text-emerald-400 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-zinc-800"
      >
        <span>@{handle}</span>
        <span className="text-[10px] text-zinc-500">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl py-1 z-50 overflow-hidden">
          <Link
            href={`/u/${handle}`}
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 transition-colors"
          >
            Settings
          </Link>
          <div className="border-t border-zinc-800 my-1"></div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
