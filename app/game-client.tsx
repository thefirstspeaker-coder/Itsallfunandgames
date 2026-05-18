"use client";

import { Game } from "@/lib/types";
import {
  useSearchParams,
  useRouter,
  usePathname,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import { useDebounce } from "use-debounce";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/game/search-bar";
import { GameGrid } from "@/components/game/game-grid";
import { PaginationControl } from "@/components/game/pagination-control";
import { getGameMetadataTokens } from "@/lib/game-metadata";

const fuseOptions = {
  keys: ["name", "description", "keywords"],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
};

type FiltersState = {
  query: string;
  page: number;
  bookmarkedOnly: boolean;
  metadata: string[];
};

const DEFAULT_PAGE = 1;
const createDefaultFilters = (): FiltersState => ({
  query: "",
  page: DEFAULT_PAGE,
  bookmarkedOnly: false,
  metadata: [],
});

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
): FiltersState => {
  const next = createDefaultFilters();
  next.query = params.get("q") ?? "";
  next.page = parsePageParam(params.get("page"));
  next.bookmarkedOnly = params.get("bookmarked") === "1";
  next.metadata = params.getAll("meta").filter(Boolean);

  return next;
};

const areFiltersEqual = (a: FiltersState, b: FiltersState) =>
  a.query === b.query && a.page === b.page && a.bookmarkedOnly === b.bookmarkedOnly && a.metadata.join("|") === b.metadata.join("|");

export function GameClient({
  allGames,
}: {
  allGames: Game[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const perPage = 12;

  const fuse = useMemo(() => new Fuse(allGames, fuseOptions), [allGames]);

  const [filters, setFilters] = useState<FiltersState>(() =>
    buildFiltersFromParams(searchParams)
  );
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [debouncedQuery] = useDebounce(filters.query, 300);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const filteredGames = useMemo(() => {
    const trimmedQuery = debouncedQuery.trim();
    const searchResults = trimmedQuery
      ? fuse.search(trimmedQuery).map((res) => res.item)
      : allGames;

    return searchResults.filter((game) => {
      if (filters.bookmarkedOnly && !bookmarkedIds.has(game.id)) return false;

      if (filters.metadata.length > 0) {
        const tokenIds = new Set(getGameMetadataTokens(game).map((token) => token.id));
        if (!filters.metadata.every((selected) => tokenIds.has(selected))) return false;
      }

      return true;
    });
  }, [allGames, debouncedQuery, filters, fuse, bookmarkedIds]);

  const totalPages = Math.ceil(filteredGames.length / perPage);
  const currentPage = Math.min(filters.page, totalPages || 1);
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    const params = new URLSearchParams();
    const trimmedQuery = filters.query.trim();
    if (trimmedQuery) params.set("q", trimmedQuery);

    if (filters.bookmarkedOnly) params.set("bookmarked", "1");
    filters.metadata.forEach((metadataId) => params.append("meta", metadataId));

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






  useEffect(() => {
    const stored = window.localStorage.getItem("iafg-bookmarks");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      setBookmarkedIds(new Set(parsed));
    } catch {}
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      window.localStorage.setItem("iafg-bookmarks", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const resetFilters = () => {
    setFilters(createDefaultFilters());
  };

  const handlePageChange = (page: number) => {
    setFilters((f) => ({ ...f, page: Math.max(page, DEFAULT_PAGE) }));
  };

  const suggestions = useMemo(() => {
    const trimmed = filters.query.trim();
    if (trimmed.length < 2) {
      return [] as Game[];
    }
    return fuse.search(trimmed).slice(0, 5).map((result) => result.item);
  }, [filters.query, fuse]);

  const showSuggestions = isSearchFocused && suggestions.length > 0;


  const trimmedQuery = filters.query.trim();
  const resultsCount = filteredGames.length;
  const heading =
    trimmedQuery.length > 0
      ? `Results for “${trimmedQuery}` + "”"
      : "Showing all games";
  const resultsSummary =
    resultsCount === 0
      ? "No games match your current filters."
      : `${resultsCount} game${resultsCount === 1 ? "" : "s"} ${trimmedQuery.length > 0
        ? "matching your criteria"
        : "ready to explore"
      }`;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      query: current.query.trim(),
      page: DEFAULT_PAGE,
    }));
  };

  const availableMetadata = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getGameMetadataTokens>[number]>();
    filteredGames.forEach((game) => {
      getGameMetadataTokens(game).forEach((token) => {
        if (!map.has(token.id)) map.set(token.id, token);
      });
    });
    return Array.from(map.values()).slice(0, 18);
  }, [filteredGames]);

  const toggleMetadataFilter = (metadataId: string) => {
    setFilters((current) => ({
      ...current,
      metadata: current.metadata.includes(metadataId)
        ? current.metadata.filter((id) => id !== metadataId)
        : [...current.metadata, metadataId],
      page: DEFAULT_PAGE,
    }));
  };

  const handleSuggestionSelect = (game: Game) => {
    setFilters((current) => ({
      ...current,
      query: game.name,
      page: DEFAULT_PAGE,
    }));
    setIsSearchFocused(false);
    inputRef.current?.blur();
  };


  return (
    <div className="relative min-h-screen bg-surface-sunken text-text-brand">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-6 px-4 py-10 lg:flex-nowrap lg:gap-10">
        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <header className="flex flex-wrap items-center gap-3 rounded-3xl border border-brand-sprout/20 bg-surface-raised p-4 shadow-sm backdrop-blur">
            <SearchBar
              query={filters.query}
              setQuery={(q) => setFilters(prev => ({ ...prev, query: q, page: DEFAULT_PAGE }))}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              showSuggestions={showSuggestions}
              suggestions={suggestions}
              handleSearchSubmit={handleSearchSubmit}
              handleSuggestionSelect={handleSuggestionSelect}
              inputRef={inputRef}
            />

          </header>

          <div className="rounded-3xl border border-brand-sprout/20 bg-surface-raised/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button type="button" variant={filters.bookmarkedOnly ? "default" : "outline"} className="rounded-full" onClick={() => setFilters((p) => ({...p, bookmarkedOnly: !p.bookmarkedOnly, page: DEFAULT_PAGE}))}>
                Bookmarked only
              </Button>
              <button className="rounded-full bg-[#f0abfc] px-6 py-3 text-sm font-semibold text-black transition hover:shadow-[0_0_24px_rgba(240,171,252,0.5)] active:scale-95">
                Explore Collection
              </button>
              <button className="rounded-full border-2 border-[#54d8e8] px-6 py-3 text-sm font-semibold text-[#54d8e8] transition hover:bg-[#54d8e8]/10 active:scale-95">
                Surprise Me
              </button>
              <div className="flex flex-wrap gap-2">
                {availableMetadata.map((item) => {
                  const isActive = filters.metadata.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleMetadataFilter(item.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${item.tone} ${isActive ? "ring-2 ring-brand-sprout" : "opacity-90 hover:opacity-100"}`}
                      aria-pressed={isActive}
                    >
                      <item.Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div>
                <h1 className="font-heading text-2xl font-semibold text-text-brand sm:text-3xl">
                  {heading}
                </h1>
                <p className="mt-2 text-sm text-text-brand/70">{resultsSummary}</p>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-text-brand/75">
              Discover activities that spark connection, collaboration, and laughs for every group size.
            </p>
          </div>


          <GameGrid
            games={paginatedGames}
            resetFilters={resetFilters}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            activeMetadataIds={filters.metadata}
            onMetadataFilter={toggleMetadataFilter}
          />

          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </main>
      </div>
    </div>
  );
}
