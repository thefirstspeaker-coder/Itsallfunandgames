'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const games = [
  { name: 'Duck Duck Goose', age: '5+', players: '5-20', time: '10m', space: 'outdoor' },
  { name: 'Charades', age: '8+', players: '4-8', time: '15m', space: 'indoor' },
  { name: 'Musical Chairs', age: '6+', players: '6-12', time: '10m', space: 'indoor' },
];

export default function ExamplePage() {
  const [query, setQuery] = useState('');
  const filtered = games.filter(g => g.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4">
        <h1>Find the perfect game for any group</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300">
          Search and filter games by age, players, time and space.
        </p>
        <div className="flex justify-center gap-4">
          <Button>Get Started</Button>
          <Button variant="secondary">Random Game</Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            placeholder="Search games..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          <div className="flex flex-wrap gap-2">
            {['Indoor', 'Outdoor', 'No Prep'].map(tag => (
              <Badge key={tag} variant="secondary" className="cursor-pointer">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(game => (
              <Card key={game.name} className="shadow-subtle">
                <CardHeader>
                  <CardTitle className="font-heading text-xl">{game.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge>{game.age} yrs</Badge>
                  <Badge>{game.players} players</Badge>
                  <Badge>{game.time}</Badge>
                  <Badge>{game.space}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-300">No games match your search.</p>
          </Card>
        )}
      </section>

      {filtered.length > 0 && (
        <section className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Space</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(game => (
                <TableRow key={game.name}>
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell>{game.age}</TableCell>
                  <TableCell>{game.players}</TableCell>
                  <TableCell>{game.time}</TableCell>
                  <TableCell>{game.space}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary">Previous</Button>
            <Button size="sm">Next</Button>
          </div>
        </section>
      )}
    </div>
  );
}
