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
import { Bookmark, Compass, Dices } from "lucide-react";
import { GAME_COLLECTIONS, getMatchingGamesForCollection } from "@/lib/collections";

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
const createDefaultFilters = (): FiltersState => ({ query: "", page: DEFAULT_PAGE, bookmarkedOnly: false, metadata: [] });
const parsePageParam = (value: string | null) => {
  if (!value) return DEFAULT_PAGE;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < DEFAULT_PAGE) return DEFAULT_PAGE;
  return parsed;
};
const buildFiltersFromParams = (params: ReadonlyURLSearchParams): FiltersState => {
  const next = createDefaultFilters();
  next.query = params.get("q") ?? "";
  next.page = parsePageParam(params.get("page"));
  next.bookmarkedOnly = params.get("bookmarked") === "1";
  next.metadata = params.getAll("meta").filter(Boolean);
  return next;
};
const areFiltersEqual = (a: FiltersState, b: FiltersState) => a.query === b.query && a.page === b.page && a.bookmarkedOnly === b.bookmarkedOnly && a.metadata.join("|") === b.metadata.join("|");

export function GameClient({ allGames }: { allGames: Game[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const perPage = 12;
  const fuse = useMemo(() => new Fuse(allGames, fuseOptions), [allGames]);

  const [filters, setFilters] = useState<FiltersState>(() => buildFiltersFromParams(searchParams));
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedQuery] = useDebounce(filters.query, 300);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [randomGameId, setRandomGameId] = useState<string | null>(null);
  const [highlightedGameId, setHighlightedGameId] = useState<string | null>(null);
  const lastRandomGameIdRef = useRef<string | null>(null);

  const filteredGames = useMemo(() => {
    const trimmedQuery = debouncedQuery.trim();
    const searchResults = trimmedQuery ? fuse.search(trimmedQuery).map((res) => res.item) : allGames;
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
  const paginatedGames = filteredGames.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    const params = new URLSearchParams();
    const trimmedQuery = filters.query.trim();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (filters.bookmarkedOnly) params.set("bookmarked", "1");
    filters.metadata.forEach((metadataId) => params.append("meta", metadataId));
    if (currentPage > 1) params.set("page", String(currentPage));
    const search = params.toString();
    const currentSearch = searchParams.toString();
    if (search === currentSearch) return;
    const next = search ? `${pathname}?${search}` : pathname;
    router.replace(next);
  }, [filters, currentPage, pathname, router, searchParams]);

  useEffect(() => {
    const nextFilters = buildFiltersFromParams(searchParams);
    setFilters((current) => (areFiltersEqual(current, nextFilters) ? current : nextFilters));
  }, [searchParams]);

  useEffect(() => {
    const stored = window.localStorage.getItem("iafg-bookmarks");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      setBookmarkedIds(new Set(parsed));
    } catch {}
  }, []);

  useEffect(() => {
    if (!isCollectionsOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCollectionsOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isCollectionsOpen]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      window.localStorage.setItem("iafg-bookmarks", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedCollectionId(null);
    setFilters(createDefaultFilters());
  };

  const handlePageChange = (page: number) => setFilters((f) => ({ ...f, page: Math.max(page, DEFAULT_PAGE) }));

  const suggestions = useMemo(() => {
    const trimmed = filters.query.trim();
    if (trimmed.length < 2) return [] as Game[];
    return fuse.search(trimmed).slice(0, 5).map((result) => result.item);
  }, [filters.query, fuse]);

  const showSuggestions = isSearchFocused && suggestions.length > 0;
  const trimmedQuery = filters.query.trim();
  const resultsCount = filteredGames.length;
  const heading = trimmedQuery.length > 0 ? `Results for “${trimmedQuery}”` : "Showing all games";
  const resultsSummary = resultsCount === 0 ? "No games match your current filters." : `${resultsCount} game${resultsCount === 1 ? "" : "s"} ${trimmedQuery.length > 0 ? "matching your criteria" : "ready to explore"}`;

  const collectionCounts = useMemo(
    () => Object.fromEntries(GAME_COLLECTIONS.map((collection) => [collection.id, allGames.filter(collection.matches).length])),
    [allGames]
  );

  const applyCollection = (collectionId: string) => {
    const matchedGames = getMatchingGamesForCollection(allGames, collectionId);
    const matchedIds = new Set(matchedGames.map((game) => game.id));
    const metadataToKeep = Array.from(new Set(matchedGames.flatMap((game) => getGameMetadataTokens(game).map((token) => token.id))));
    setSelectedCollectionId(collectionId);
    setFilters((current) => ({ ...current, query: "", bookmarkedOnly: false, metadata: current.metadata.filter((id) => metadataToKeep.includes(id)), page: DEFAULT_PAGE }));
    if (matchedIds.size === 0) return;
    setFilters((current) => ({ ...current, page: DEFAULT_PAGE }));
    setRandomGameId(null);
    setHighlightedGameId(null);
  };

  const clearCollection = () => {
    setSelectedCollectionId(null);
    setFilters(createDefaultFilters());
  };

  const visibleGames = useMemo(() => {
    if (!selectedCollectionId) return filteredGames;
    const ids = new Set(getMatchingGamesForCollection(allGames, selectedCollectionId).map((game) => game.id));
    return filteredGames.filter((game) => ids.has(game.id));
  }, [allGames, filteredGames, selectedCollectionId]);

  const currentRandomGame = useMemo(() => visibleGames.find((game) => game.id === randomGameId) ?? null, [visibleGames, randomGameId]);

  const pickSurpriseGame = () => {
    if (visibleGames.length === 0) {
      setRandomGameId(null);
      return;
    }
    const eligible = visibleGames.filter((game) => game.id !== lastRandomGameIdRef.current);
    const pool = eligible.length > 0 ? eligible : visibleGames;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    lastRandomGameIdRef.current = picked.id;
    setRandomGameId(picked.id);
    setHighlightedGameId(picked.id);
    setTimeout(() => setHighlightedGameId((current) => (current === picked.id ? null : current)), 2200);
    document.getElementById(`game-card-${picked.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, query: current.query.trim(), page: DEFAULT_PAGE }));
  };

  const availableMetadata = useMemo(() => {
    const sourceGames = selectedCollectionId ? visibleGames : filteredGames;
    const map = new Map<string, ReturnType<typeof getGameMetadataTokens>[number]>();
    sourceGames.forEach((game) => {
      getGameMetadataTokens(game).forEach((token) => {
        if (!map.has(token.id)) map.set(token.id, token);
      });
    });
    return Array.from(map.values()).slice(0, 18);
  }, [filteredGames, selectedCollectionId, visibleGames]);

  const toggleMetadataFilter = (metadataId: string) => setFilters((current) => ({ ...current, metadata: current.metadata.includes(metadataId) ? current.metadata.filter((id) => id !== metadataId) : [...current.metadata, metadataId], page: DEFAULT_PAGE }));

  const handleSuggestionSelect = (game: Game) => {
    setFilters((current) => ({ ...current, query: game.name, page: DEFAULT_PAGE }));
    setIsSearchFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative min-h-screen bg-surface-sunken text-text-brand">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-6 px-4 py-10 lg:flex-nowrap lg:gap-10">
        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-5">
            <SearchBar query={filters.query} setQuery={(q) => setFilters(prev => ({ ...prev, query: q, page: DEFAULT_PAGE }))} isSearchFocused={isSearchFocused} setIsSearchFocused={setIsSearchFocused} showSuggestions={showSuggestions} suggestions={suggestions} handleSearchSubmit={handleSearchSubmit} handleSuggestionSelect={handleSuggestionSelect} inputRef={inputRef} />
          </header>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant={filters.bookmarkedOnly ? "default" : "outline"} className="h-11 gap-2 rounded-xl border-white/20 bg-brand-marigold px-4 text-sm font-semibold text-brand-ink hover:bg-brand-marigold-dark" onClick={() => setFilters((p) => ({ ...p, bookmarkedOnly: !p.bookmarkedOnly, page: DEFAULT_PAGE }))}>
                  <Bookmark className="h-4 w-4" /> Bookmark only
                </Button>
                <button type="button" aria-label="Explore curated game collections" aria-expanded={isCollectionsOpen} onClick={() => setIsCollectionsOpen((open) => !open)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-fuchsia-300/40 bg-fuchsia-400/20 px-4 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70">
                  <Compass className="h-4 w-4" /> Explore Collection
                </button>
                <button type="button" aria-label="Pick a random game" onClick={pickSurpriseGame} className="inline-flex h-11 items-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                  <Dices className="h-4 w-4" /> Surprise Me
                </button>
                {selectedCollectionId && <Button type="button" variant="ghost" className="h-11 rounded-xl text-sm" onClick={clearCollection}>Clear collection</Button>}
              </div>

              {isCollectionsOpen && (
                <section className="rounded-2xl border border-white/15 bg-black/25 p-4" aria-label="Curated collections">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-brand/90">Browse by collection</p>
                    <button type="button" onClick={() => setIsCollectionsOpen(false)} className="text-xs text-text-brand/70 hover:text-text-brand">Close</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {GAME_COLLECTIONS.map((collection) => {
                      const active = selectedCollectionId === collection.id;
                      return (
                        <button key={collection.id} type="button" onClick={() => applyCollection(collection.id)} className={`rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70 ${active ? "border-fuchsia-200/70 bg-fuchsia-400/30" : "border-white/15 bg-white/5 hover:bg-white/10"}`}>
                          <p className="text-sm font-semibold text-text-brand">{collection.title}</p>
                          <p className="mt-1 text-xs text-text-brand/75">{collection.description}</p>
                          <p className="mt-2 text-xs text-text-brand/65">{collectionCounts[collection.id] ?? 0} games</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {randomGameId && (
                <section className="rounded-2xl border border-cyan-300/40 bg-cyan-400/15 p-4" aria-live="polite">
                  {currentRandomGame ? (
                    <>
                      <p className="text-sm font-semibold text-cyan-100">🎲 Surprise pick: {currentRandomGame.name}</p>
                      <p className="mt-1 text-sm text-cyan-50/90">{currentRandomGame.description || "A playful activity for your group."}</p>
                      <p className="mt-2 text-xs text-cyan-100/80">Ages: {currentRandomGame.ageMin ?? "?"}–{currentRandomGame.ageMax ?? "?"} • Players: {currentRandomGame.playersMin ?? "?"}{currentRandomGame.playersMax ? `-${currentRandomGame.playersMax}` : "+"} • Prep: {currentRandomGame.prepLevel ?? "Unknown"}</p>
                      <p className="mt-1 text-xs text-cyan-100/80">{selectedCollectionId || trimmedQuery || filters.metadata.length > 0 || filters.bookmarkedOnly ? "Picked from your current filters." : "Picked from the full collection."}</p>
                      <Button type="button" size="sm" onClick={pickSurpriseGame} className="mt-3 rounded-full bg-cyan-200 text-cyan-950 hover:bg-cyan-100">Try another</Button>
                    </>
                  ) : (
                    <p className="text-sm text-cyan-50">No matching games right now. Try clearing some filters first.</p>
                  )}
                </section>
              )}

              <div className="flex flex-wrap gap-2.5">
                {availableMetadata.map((item) => {
                  const isActive = filters.metadata.includes(item.id);
                  return (
                    <button key={item.id} type="button" onClick={() => toggleMetadataFilter(item.id)} className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-marigold/70 ${isActive ? "border-brand-sprout/70 bg-brand-sprout/20 text-text-brand shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "border-white/20 bg-black/25 text-text-brand/85 hover:border-brand-sprout/45 hover:bg-black/35"}`} aria-pressed={isActive}>
                      <item.Icon className="h-3.5 w-3.5 shrink-0 text-text-brand/80" /> {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="pt-1"><h1 className="font-heading text-2xl font-semibold text-text-brand sm:text-3xl">{heading}</h1><p className="mt-2 text-sm text-text-brand/70">{resultsSummary}</p></div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-text-brand/75">Discover activities that spark connection, collaboration, and laughs for every group size.</p>
          </div>

          <GameGrid games={selectedCollectionId ? visibleGames.slice((currentPage - 1) * perPage, currentPage * perPage) : paginatedGames} resetFilters={resetFilters} bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} activeMetadataIds={filters.metadata} onMetadataFilter={toggleMetadataFilter} highlightedGameId={highlightedGameId} />
          <PaginationControl currentPage={currentPage} totalPages={Math.ceil((selectedCollectionId ? visibleGames.length : filteredGames.length) / perPage)} onPageChange={handlePageChange} />
        </main>
      </div>
    </div>
  );
}
