
// app/game-client.tsx
'use client';

import { Game } from '@/lib/types';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import Fuse from 'fuse.js';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    category: searchParams.get('category') || '',
    tags: searchParams.get('tags') || '',
    traditionality: searchParams.get('traditionality') || '',
    prepLevel: searchParams.get('prepLevel') || '',
    skillsDeveloped: searchParams.get('skillsDeveloped') || '',
    regionalPopularity: searchParams.get('regionalPopularity') || '',
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

    // 2. Facet filtering
    result = result.filter(game => {
      if (filters.category && game.category !== filters.category) return false;
      if (filters.tags && !(game.tags || []).includes(filters.tags)) return false;
      if (filters.traditionality && game.traditionality !== filters.traditionality) return false;
      if (filters.prepLevel && game.prepLevel !== filters.prepLevel) return false;
      if (filters.skillsDeveloped && !(game.skillsDeveloped || []).includes(filters.skillsDeveloped)) return false;
      if (filters.regionalPopularity && game.regionalPopularity !== filters.regionalPopularity) return false;
      return true;
    });

    // 3. Sorting
    result.sort((a, b) => {
        if (filters.sort === 'name_asc') return a.name.localeCompare(b.name);
        if (filters.sort === 'age_asc') return (a.ageMin || 99) - (b.ageMin || 99);
        // ... other sorts
        return 0;
    });

    return result;
  }, [allGames, debouncedQuery, filters]);

  // Effect to update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.sort !== 'name_asc') params.set('sort', filters.sort);
    if (filters.category) params.set('category', filters.category);
    if (filters.tags) params.set('tags', filters.tags);
    if (filters.traditionality) params.set('traditionality', filters.traditionality);
    if (filters.prepLevel) params.set('prepLevel', filters.prepLevel);
    if (filters.skillsDeveloped) params.set('skillsDeveloped', filters.skillsDeveloped);
    if (filters.regionalPopularity) params.set('regionalPopularity', filters.regionalPopularity);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search by name..."
          value={filters.query}
          onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
          className="w-full sm:max-w-xs"
        />
        <Select
          value={filters.category}
          onValueChange={value => setFilters(f => ({ ...f, category: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {facets.category.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.tags}
          onValueChange={value => setFilters(f => ({ ...f, tags: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            {facets.tags.map(tag => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.traditionality}
          onValueChange={value => setFilters(f => ({ ...f, traditionality: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Traditionality" />
          </SelectTrigger>
          <SelectContent>
            {facets.traditionality.map(trad => (
              <SelectItem key={trad} value={trad}>
                {trad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.prepLevel}
          onValueChange={value => setFilters(f => ({ ...f, prepLevel: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Prep level" />
          </SelectTrigger>
          <SelectContent>
            {facets.prepLevel.map(level => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.skillsDeveloped}
          onValueChange={value => setFilters(f => ({ ...f, skillsDeveloped: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Skill" />
          </SelectTrigger>
          <SelectContent>
            {facets.skillsDeveloped.map(skill => (
              <SelectItem key={skill} value={skill}>
                {skill}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.regionalPopularity}
          onValueChange={value => setFilters(f => ({ ...f, regionalPopularity: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {facets.regionalPopularity.map(region => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div ref={parentRef} className="h-[80vh] overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {game.description}
                    </p>
                    <div className="mt-2">
                      {game.tags
                        .slice(0, 3)
                        .map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="mr-1"
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      {filteredGames.length === 0 && (
        <p className="text-center text-muted-foreground">No games found.</p>
      )}
    </div>
  );
}