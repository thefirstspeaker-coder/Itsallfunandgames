// app/page.tsx
import { games } from '@/lib/loadGames';
import { GameClient } from './game-client';
import { Game } from '@/lib/types';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Helper to get unique facet values
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
    <section className="relative z-10 space-y-12 sm:space-y-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-cyan-200 shadow-sm">
          <span aria-hidden="true">🎲</span>
          Game inspiration
        </span>
        <h1 className="bg-gradient-to-r from-cyan-200 via-sky-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl lg:text-6xl">
          Find Your Next Favourite Game
        </h1>
        <p className="mt-4 text-lg text-slate-300 sm:text-xl">
          Browse curated activities, mix and match filters, and plan unforgettable play sessions for any group, age, or space.
        </p>
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
    </section>
  );
}
