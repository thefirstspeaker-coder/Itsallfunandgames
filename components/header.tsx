'use client';

import Link from 'next/link';
import { Bell, Menu, Moon, Sun, UserCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';

export function Header() {
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#0c1324]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-heading text-xl font-extrabold tracking-tight text-[#fbd2ff] md:text-2xl">
            itsallfunandgames
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-[#d1c2cf] md:flex">
            <Link href="/" className="border-b-2 border-[#fbd2ff] pb-1 font-semibold text-[#fbd2ff]">Discover</Link>
            <Link href="/data/quality" className="transition-colors hover:text-[#dce1fb]">Diagnostics</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
            className="rounded-full p-2 text-[#fbd2ff] transition hover:bg-white/10"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </button>
          <button type="button" className="hidden rounded-full p-2 text-[#fbd2ff] transition hover:bg-white/10 md:inline-flex"><Bell className="h-4 w-4" /></button>
          <button type="button" className="hidden rounded-full p-2 text-[#fbd2ff] transition hover:bg-white/10 md:inline-flex"><UserCircle2 className="h-4 w-4" /></button>
          <button type="button" className="inline-flex rounded-full p-2 text-[#fbd2ff] transition hover:bg-white/10 md:hidden"><Menu className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}
