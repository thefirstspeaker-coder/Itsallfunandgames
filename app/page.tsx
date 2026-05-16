import { games } from '@/lib/loadGames';
import { GameClient } from './game-client';
import { Game } from '@/lib/types';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const getUniqueValues = (games: Game[], key: keyof Game) => {
  const values = new Set<string>();
  games.forEach(game => {
    const value = game[key];
    if (typeof value === 'string' && value) {
      values.add(value);
    } else if (Array.isArray(value)) {
      value.forEach(v => typeof v === 'string' && v && values.add(v));
    }
  });
  return Array.from(values).sort();
};

const toRange = (min?: number | null, max?: number | null) => {
  if (typeof min === 'number' && typeof max === 'number') return `${min}–${max}`;
  if (typeof min === 'number') return `${min}+`;
  if (typeof max === 'number') return `Up to ${max}`;
  return null;
};

export default function HomePage() {
  const sortedGames = [...games].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  const facets = {
    category: getUniqueValues(sortedGames, 'category'),
    tags: getUniqueValues(sortedGames, 'tags'),
    prepLevel: getUniqueValues(sortedGames, 'prepLevel'),
    playersRange: Array.from(new Set(sortedGames.map((g) => toRange(g.playersMin, g.playersMax)).filter(Boolean) as string[])).sort(),
    ageRange: Array.from(new Set(sortedGames.map((g) => toRange(g.ageMin, g.ageMax)).filter(Boolean) as string[])).sort(),
    equipmentNeeded: Array.from(new Set(sortedGames.map((g) => (g.equipment ? 'Equipment needed' : null)).filter(Boolean) as string[])).sort(),
    skillsDeveloped: getUniqueValues(sortedGames, 'skillsDeveloped'),
  };

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
          <p className="mt-4 text-lg text-[#94A3B8]">
            Browse curated activities, filter in seconds, and plan unforgettable sessions for any group, age, or space.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-[#f0abfc] px-6 py-3 text-sm font-semibold text-black transition hover:shadow-[0_0_24px_rgba(240,171,252,0.5)] active:scale-95">
              Explore Collection
            </button>
            <button className="rounded-full border-2 border-[#54d8e8] px-6 py-3 text-sm font-semibold text-[#54d8e8] transition hover:bg-[#54d8e8]/10 active:scale-95">
              Surprise Me
            </button>
          </div>
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
        <GameClient allGames={sortedGames} facets={facets} />
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
