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

export default function HomePage() {
  const facets = {
    category: getUniqueValues(games, 'category'),
    tags: getUniqueValues(games, 'tags'),
    traditionality: getUniqueValues(games, 'traditionality'),
    prepLevel: getUniqueValues(games, 'prepLevel'),
    skillsDeveloped: getUniqueValues(games, 'skillsDeveloped'),
    regionalPopularity: getUniqueValues(games, 'regionalPopularity'),
  };

  return (
    <section className="relative z-10 space-y-12 sm:space-y-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-primary shadow-sm">
          <span aria-hidden="true">🎲</span>
          Game inspiration
        </span>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Find Your Next Favourite Game
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
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
        <GameClient allGames={games} facets={facets} />
      </Suspense>
    </section>
  );
}
