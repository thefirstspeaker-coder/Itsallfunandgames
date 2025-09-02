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
    <section className="space-y-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-primary">Find Your Next Favourite Game</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find the perfect game for any group, age, and space.
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
