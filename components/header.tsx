// components/header.tsx
'use client';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

export function Header() {
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-400/20 bg-slate-950/75 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/65">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-heading text-2xl font-bold tracking-tight text-cyan-300 transition-colors hover:text-fuchsia-300"
        >
          itsallfunandgames
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-200">
          <Link href="/data/quality" className="transition-colors hover:text-cyan-300">
            Diagnostics
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
