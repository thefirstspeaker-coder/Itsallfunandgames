// components/header.tsx
'use client';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

export function Header() {
  const { setTheme, theme } = useTheme();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">itsallfunandgames</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
             <Link href="/data/quality">Diagnostics</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  );
}