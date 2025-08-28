// app/page.tsx
import { games } from '@/lib/loadGames';
import { GameClient } from './game-client';
import { Game } from '@/lib/types';
import { Suspense } from 'react';

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
    <section>
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tighter lg:text-5xl">
          Find Your Next Favourite Game
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-lg text-muted-foreground">
          Find the perfect game for any group, age, and space.
        </p>
      </div>
      <div className="mt-8">
        <Suspense fallback={<div>Loading filters...</div>}>
            <GameClient allGames={games} facets={facets} />
        </Suspense>
      </div>
    </section>
  );
}