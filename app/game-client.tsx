// app/game-client.tsx
"use client";

import { Game } from "@/lib/types";
import {
  useSearchParams,
  useRouter,
  usePathname,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import Fuse from "fuse.js";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const fuseOptions = {
  keys: ["name", "description", "keywords"],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
};

type Facets = Record<string, string[]>;

type FiltersState = {
  query: string;
  category: string;
  tags: string;
  traditionality: string;
  prepLevel: string;
  skillsDeveloped: string;
  regionalPopularity: string;
  page: number;
};

const DEFAULT_PAGE = 1;

const parsePageParam = (value: string | null) => {
  if (!value) {
    return DEFAULT_PAGE;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < DEFAULT_PAGE) {
    return DEFAULT_PAGE;
  }
  return parsed;
};

const buildFiltersFromParams = (
  params: ReadonlyURLSearchParams
): FiltersState => ({
  query: params.get("q") ?? "",
  category: params.get("category") ?? "",
  tags: params.get("tags") ?? "",
  traditionality: params.get("traditionality") ?? "",
  prepLevel: params.get("prepLevel") ?? "",
  skillsDeveloped: params.get("skillsDeveloped") ?? "",
  regionalPopularity: params.get("regionalPopularity") ?? "",
  page: parsePageParam(params.get("page")),
});

const areFiltersEqual = (a: FiltersState, b: FiltersState) =>
  a.query === b.query &&
  a.category === b.category &&
  a.tags === b.tags &&
  a.traditionality === b.traditionality &&
  a.prepLevel === b.prepLevel &&
  a.skillsDeveloped === b.skillsDeveloped &&
  a.regionalPopularity === b.regionalPopularity &&
  a.page === b.page;

export function GameClient({
  allGames,
  facets,
}: {
  allGames: Game[];
  facets: Facets;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const perPage = 12;

  const [filters, setFilters] = useState<FiltersState>(() =>
    buildFiltersFromParams(searchParams)
  );

  const [debouncedQuery] = useDebounce(filters.query, 300);

  const filteredGames = useMemo(() => {
    let result = allGames;

    if (debouncedQuery) {
      const fuse = new Fuse(allGames, fuseOptions);
      result = fuse.search(debouncedQuery).map((res) => res.item);
    }

    result = result.filter((game) => {
      if (filters.category && game.category !== filters.category) return false;
      if (filters.tags && !(game.tags || []).includes(filters.tags)) return false;
      if (filters.traditionality && game.traditionality !== filters.traditionality)
        return false;
      if (filters.prepLevel && game.prepLevel !== filters.prepLevel) return false;
      if (
        filters.skillsDeveloped &&
        !(game.skillsDeveloped || []).includes(filters.skillsDeveloped)
      )
        return false;
      if (
        filters.regionalPopularity &&
        !(game.regionalPopularity || []).includes(filters.regionalPopularity)
      )
        return false;
      return true;
    });

    return result;
  }, [allGames, debouncedQuery, filters]);

  const totalPages = Math.ceil(filteredGames.length / perPage);
  const currentPage = Math.min(filters.page, totalPages || 1);
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.category) params.set("category", filters.category);
    if (filters.tags) params.set("tags", filters.tags);
    if (filters.traditionality)
      params.set("traditionality", filters.traditionality);
    if (filters.prepLevel) params.set("prepLevel", filters.prepLevel);
    if (filters.skillsDeveloped)
      params.set("skillsDeveloped", filters.skillsDeveloped);
    if (filters.regionalPopularity)
      params.set("regionalPopularity", filters.regionalPopularity);
    if (currentPage > 1) params.set("page", String(currentPage));

    const search = params.toString();
    const currentSearch = searchParams.toString();

    if (search === currentSearch) {
      return;
    }

    const next = search ? `${pathname}?${search}` : pathname;
    router.replace(next);
  }, [filters, currentPage, pathname, router, searchParams]);

  useEffect(() => {
    const nextFilters = buildFiltersFromParams(searchParams);
    setFilters((current) =>
      areFiltersEqual(current, nextFilters) ? current : nextFilters
    );
  }, [searchParams]);

  const handlePageChange = (page: number) => {
    setFilters((f) => ({ ...f, page: Math.max(page, DEFAULT_PAGE) }));
  };

  const resetFilters = () => {
    setFilters({
      query: "",
      category: "",
      tags: "",
      traditionality: "",
      prepLevel: "",
      skillsDeveloped: "",
      regionalPopularity: "",
      page: DEFAULT_PAGE,
    });
  };

  // Playful palettes for card frames/buttons
  const palettes = [
    { frame: "from-amber-400 to-yellow-300", accent: "bg-amber-500 hover:bg-amber-600", subtle: "bg-amber-50" },
    { frame: "from-rose-400 to-red-300", accent: "bg-rose-500 hover:bg-rose-600", subtle: "bg-rose-50" },
    { frame: "from-teal-400 to-emerald-300", accent: "bg-teal-500 hover:bg-teal-600", subtle: "bg-teal-50" },
    { frame: "from-sky-400 to-blue-300", accent: "bg-sky-500 hover:bg-sky-600", subtle: "bg-sky-50" },
    { frame: "from-violet-400 to-fuchsia-300", accent: "bg-violet-500 hover:bg-violet-600", subtle: "bg-violet-50" },
    { frame: "from-lime-400 to-green-300", accent: "bg-lime-500 hover:bg-lime-600", subtle: "bg-lime-50" },
  ];
  const getPalette = (id?: string) => palettes[Math.abs(id?.length || 0) % palettes.length];

  return (
    <div className="space-y-8">
      {/* Filter tabs styled as links */}
      <div className="flex flex-wrap items-center gap-3 md:gap-6">
        <Select
          value={filters.category}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, category: value, page: DEFAULT_PAGE }))
          }
        >
          <SelectTrigger className="h-9 min-w-28 rounded-md border border-input bg-card px-3 text-sm font-medium shadow-sm" aria-label="Group">
            <SelectValue placeholder="Group" />
          </SelectTrigger>
          <SelectContent>
            {facets.category.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.tags}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, tags: value, page: DEFAULT_PAGE }))
          }
        >
          <SelectTrigger className="h-9 min-w-28 rounded-md border border-input bg-card px-3 text-sm font-medium shadow-sm" aria-label="Type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {facets.tags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.traditionality}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, traditionality: value, page: DEFAULT_PAGE }))
          }
        >
          <SelectTrigger className="h-9 min-w-28 rounded-md border border-input bg-card px-3 text-sm font-medium shadow-sm" aria-label="Traditionality">
            <SelectValue placeholder="Traditionality" />
          </SelectTrigger>
          <SelectContent>
            {facets.traditionality.map((trad) => (
              <SelectItem key={trad} value={trad}>
                {trad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.prepLevel}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, prepLevel: value, page: DEFAULT_PAGE }))
          }
        >
          <SelectTrigger className="h-9 min-w-28 rounded-md border border-input bg-card px-3 text-sm font-medium shadow-sm" aria-label="Prep Level">
            <SelectValue placeholder="Prep Level" />
          </SelectTrigger>
          <SelectContent>
            {facets.prepLevel.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.skillsDeveloped}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, skillsDeveloped: value, page: DEFAULT_PAGE }))
          }
        >
          <SelectTrigger className="h-9 min-w-28 rounded-md border border-input bg-card px-3 text-sm font-medium shadow-sm" aria-label="Skill">
            <SelectValue placeholder="Skill" />
          </SelectTrigger>
          <SelectContent>
            {facets.skillsDeveloped.map((skill) => (
              <SelectItem key={skill} value={skill}>
                {skill}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.regionalPopularity}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, regionalPopularity: value, page: DEFAULT_PAGE }))
          }
        >
          <SelectTrigger className="h-9 min-w-28 rounded-md border border-input bg-card px-3 text-sm font-medium shadow-sm" aria-label="Region">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {facets.regionalPopularity.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          className="ml-auto rounded-full bg-rose-500 px-4 py-1.5 text-white hover:bg-rose-600"
          onClick={resetFilters}
        >
          Clear Filter
        </Button>
      </div>

      {/* Centered search */}
      <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full bg-white/80 p-2 shadow-subtle ring-1 ring-black/5">
        <Input
          aria-label="Search games"
          placeholder="Search"
          value={filters.query}
          onChange={(e) =>
            setFilters((f) => ({ ...f, query: e.target.value, page: DEFAULT_PAGE }))
          }
          className="h-10 border-none bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button className="h-10 rounded-full bg-rose-500 px-5 text-white hover:bg-rose-600">
          Go
        </Button>
      </div>

      {paginatedGames.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedGames.map((game) => {
            const p = getPalette(game.id);
            return (
              <div key={game.id} className={`rounded-2xl p-1 bg-gradient-to-br ${p.frame}`}>
                <div className="rounded-[18px] bg-white/80 p-1">
                  <Card className="border-none bg-white/90 shadow transition-transform hover:-translate-y-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl font-black tracking-tight">
                        <Link href={`/game/${game.id}`} className="hover:underline">
                          {game.name}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className={`rounded-lg p-4 text-sm text-muted-foreground ${p.subtle}`}>
                        <p className="line-clamp-3">{game.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {typeof game.ageMin === "number" && (
                            <Badge variant="secondary">
                              Ages {game.ageMin}
                              {typeof game.ageMax === "number" ? `–${game.ageMax}` : "+"}
                            </Badge>
                          )}
                          {typeof game.playersMin === "number" && (
                            <Badge variant="secondary">
                              {game.playersMin}
                              {typeof game.playersMax === "number" ? `–${game.playersMax}` : "+"} players
                            </Badge>
                          )}
                          {game.prepLevel && <Badge variant="secondary">{game.prepLevel}</Badge>}
                          {game.traditionality && <Badge variant="secondary">{game.traditionality}</Badge>}
                        </div>
                      </div>
                      {game.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {game.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="pt-2">
                        <Link href={`/game/${game.id}`}>
                          <Button className={`w-full rounded-full text-white ${p.accent}`}>
                            More Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Image
            src="/file.svg"
            alt="No games"
            width={120}
            height={120}
            className="mb-6 opacity-80"
          />
          <p className="mb-4 text-muted-foreground">
            No games found. Try adjusting your filters.
          </p>
          <Button onClick={resetFilters}>Reset filters</Button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination>
            <PaginationContent>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(i + 1);
                    }}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              className="rounded-full bg-emerald-500 px-5 text-white hover:bg-emerald-600"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            >
              Next
            </Button>
            <Button
              className="rounded-full bg-rose-500 px-5 text-white hover:bg-rose-600"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            >
              Previous
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
