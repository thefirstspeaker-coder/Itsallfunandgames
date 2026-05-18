import { games } from '@/lib/loadGames';
import { GameClient } from './game-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


export default function HomePage() {
  const sortedGames = [...games].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );


  return (
    <section className="space-y-12 md:space-y-16">
      <div className="relative overflow-hidden rounded-[28px] border border-[#1E293B] bg-gradient-to-br from-[#2e3447]/80 to-[#151b2d]/90 p-6 md:p-12">
        <div className="pointer-events-none absolute -right-32 -top-36 h-80 w-80 rounded-full bg-[#f0abfc]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-[#02aebe]/20 blur-3xl" />
        <div className="relative max-w-3xl rounded-2xl border border-[#1E293B] bg-[#0f172a]/60 p-6 backdrop-blur-xl md:p-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1E293B] bg-[#23293c]/70 px-4 py-1 text-sm font-semibold text-[#d1c2cf]">
            🎲 Game inspiration
          </span>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#dce1fb] md:text-6xl">Find Your Next Favourite Game</h1>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        }
      >
        <GameClient allGames={sortedGames} />
      </Suspense>

      <footer className="rounded-3xl border border-[#1E293B] bg-[#070d1f] px-6 py-10 text-[#94A3B8] md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <p className="font-heading text-xl font-bold text-[#fbd2ff]">itsallfunandgames</p>
          <p className="text-sm">© 2026 Itsallfunandgames. All play, no work.</p>
        </div>
      </footer>
    </section>
  );
}
