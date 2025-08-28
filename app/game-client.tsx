
// app/game-client.tsx
'use client';

import { Game } from '@/lib/types';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import Fuse from 'fuse.js';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Assume Fuse.js is dynamically imported in a real app for performance
const fuseOptions = {
  keys: ['name', 'description', 'keywords'],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
};

// Main Client Component
export function GameClient({ allGames, facets }: { allGames: Game[]; facets: Record<string, string[]> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State from URL
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    sort: searchParams.get('sort') || 'name_asc',
    age: searchParams.get('age')?.split(',').map(Number) || [0, 99],
    players: searchParams.get('players')?.split(',').map(Number) || [1, 99],
    // ... other facets
  });

  const [debouncedQuery] = useDebounce(filters.query, 300);

  // Memoized filtering logic
  const filteredGames = useMemo(() => {
    let result = allGames;

    // 1. Fuse.js search
    if (debouncedQuery) {
      const fuse = new Fuse(allGames, fuseOptions);
      result = fuse.search(debouncedQuery).map(res => res.item);
    }
    
    // 2. Facet and Range filtering
    // ... implement logic for age, players, category, etc.
    // This part can get complex; for now, we'll just sort
    
    // 3. Sorting
    result.sort((a, b) => {
        if (filters.sort === 'name_asc') return a.name.localeCompare(b.name);
        if (filters.sort === 'age_asc') return (a.ageMin || 99) - (b.ageMin || 99);
        // ... other sorts
        return 0;
    });

    return result;
  }, [allGames, debouncedQuery, filters.sort /*, other filters */]);

  // Effect to update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.sort !== 'name_asc') params.set('sort', filters.sort);
    // ... set other params
    router.replace(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredGames.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimate row height
    overscan: 5,
  });

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
      {/* Filters Sidebar */}
      <aside className="md:col-span-1">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="space-y-4 mt-4">
            <Input 
                placeholder="Search by name..."
                value={filters.query}
                onChange={(e) => setFilters(f => ({...f, query: e.target.value}))}
            />
            {/* ... Add other filter controls like Select, Slider etc. */}
        </div>
      </aside>

      {/* Game List */}
      <div className="md:col-span-3">
        <div ref={parentRef} className="h-[80vh] overflow-y-auto">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map(virtualItem => {
              const game = filteredGames[virtualItem.index];
              return (
                <div
                  key={game.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="p-2"
                >
                  <Card>
                    <CardHeader>
                        <Link href={`/game/${game.id}`}>
                            <CardTitle>{game.name}</CardTitle>
                        </Link>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{game.description}</p>
                      <div className="mt-2">
                        {game.tags.slice(0, 3).map(tag => <Badge key={tag} variant="secondary" className="mr-1">{tag}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
        {filteredGames.length === 0 && <p className="text-center text-muted-foreground">No games found.</p>}
      </div>
    </div>
  );
}