'use client';

import Link from 'next/link';
import { Bell, Menu, UserCircle2 } from 'lucide-react';

export function Header() {
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
          <button type="button" className="hidden rounded-full p-2 text-[#fbd2ff] transition hover:bg-white/10 md:inline-flex"><Bell className="h-4 w-4" /></button>
          <button type="button" className="hidden rounded-full p-2 text-[#fbd2ff] transition hover:bg-white/10 md:inline-flex"><UserCircle2 className="h-4 w-4" /></button>
          <button type="button" className="inline-flex rounded-full p-2 text-[#fbd2ff] transition hover:bg-white/10 md:hidden"><Menu className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}
