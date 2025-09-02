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
    <div className="max-w-6xl mx-auto px-6 py-12">
      <section className="text-center space-y-4">
        <h1 className="font-heading text-4xl font-bold">
          It’s All Fun and Games
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300">
          Find the perfect game for any group, age, or space.
        </p>
        <div className="flex justify-center gap-4">
          <Button>Browse Games</Button>
          <Button variant="outline">Random Game</Button>
        </div>
      </section>

      <section className="mt-12">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap mb-8">
          <Chip>Age</Chip>
          <Chip>Players</Chip>
          <Chip>Time</Chip>
          <Chip>Space</Chip>
        </div>

        {/* Game Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example card */}
        </div>

        {/* Table (alt view) */}
        <Table className="mt-12">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Players</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Space</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Rows here */}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
