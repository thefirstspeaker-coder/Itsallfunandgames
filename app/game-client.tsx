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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Filter,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn, prettifyFilterValue } from "@/lib/utils";
import { FacetKey, facetKeys, filterMeta } from "@/lib/constants";
import { FilterSidebar } from "@/components/game/filter-sidebar";
import { SearchBar } from "@/components/game/search-bar";
import { GameGrid } from "@/components/game/game-grid";
import { PaginationControl } from "@/components/game/pagination-control";

const fuseOptions = {
  keys: ["name", "description", "keywords"],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
};

type Facets = Record<FacetKey, string[]>;

type FiltersState = {
  query: string;
  page: number;
} & {
  [K in FacetKey]: string[];
};

const DEFAULT_PAGE = 1;

const createEmptySelections = (): Record<FacetKey, string[]> =>
  facetKeys.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {} as Record<FacetKey, string[]>);

const createDefaultFilters = (): FiltersState => ({
  query: "",
  page: DEFAULT_PAGE,
  ...createEmptySelections(),
});

const createEmptySearches = (): Record<FacetKey, string> =>
  facetKeys.reduce((acc, key) => {
    acc[key] = "";
    return acc;
  }, {} as Record<FacetKey, string>);

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

  facetKeys.forEach((key) => {
    const values = params
      .getAll(key)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (values.length > 0) {
      next[key] = Array.from(new Set(values)).sort((a, b) =>
        a.localeCompare(b)
      );
    }
  });

  return next;
};

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const areFiltersEqual = (a: FiltersState, b: FiltersState) => {
  if (a.query !== b.query || a.page !== b.page) return false;
  return facetKeys.every((key) => arraysEqual(a[key], b[key]));
};

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

  const fuse = useMemo(() => new Fuse(allGames, fuseOptions), [allGames]);

  const [filters, setFilters] = useState<FiltersState>(() =>
    buildFiltersFromParams(searchParams)
  );
  const [filterSearches, setFilterSearches] = useState<Record<FacetKey, string>>(
    () => createEmptySearches()
  );
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterRailCollapsed, setIsFilterRailCollapsed] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [pendingScrollKey, setPendingScrollKey] = useState<FacetKey | null>(
    null
  );
  const closeFilterSheet = () => setIsFilterSheetOpen(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialExpandedFiltersRef = useRef<FacetKey[] | null>(null);

  if (initialExpandedFiltersRef.current === null) {
    initialExpandedFiltersRef.current = facetKeys.filter(
      (key) => filters[key].length > 0
    );
  }

  const [debouncedQuery] = useDebounce(filters.query, 300);

  const filteredGames = useMemo(() => {
    const trimmedQuery = debouncedQuery.trim();
    const searchResults = trimmedQuery
      ? fuse.search(trimmedQuery).map((res) => res.item)
      : allGames;

    return searchResults.filter((game) => {
      const {
        category: selectedCategories,
        tags: selectedTags,
        traditionality: selectedTraditionality,
        prepLevel: selectedPrepLevels,
        skillsDeveloped: selectedSkills,
        regionalPopularity: selectedRegions,
      } = filters;

      if (
        selectedCategories.length > 0 &&
        (!game.category || !selectedCategories.includes(game.category))
      ) {
        return false;
      }

      if (
        selectedTags.length > 0 &&
        !(game.tags || []).some((tag) => selectedTags.includes(tag))
      ) {
        return false;
      }

      if (
        selectedTraditionality.length > 0 &&
        (!game.traditionality ||
          !selectedTraditionality.includes(game.traditionality))
      ) {
        return false;
      }

      if (
        selectedPrepLevels.length > 0 &&
        (!game.prepLevel || !selectedPrepLevels.includes(game.prepLevel))
      ) {
        return false;
      }

      if (
        selectedSkills.length > 0 &&
        !(game.skillsDeveloped || []).some((skill) =>
          selectedSkills.includes(skill)
        )
      ) {
        return false;
      }

      if (
        selectedRegions.length > 0 &&
        !(game.regionalPopularity || []).some((region) =>
          selectedRegions.includes(region)
        )
      ) {
        return false;
      }

      return true;
    });
  }, [allGames, debouncedQuery, filters, fuse]);

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

    facetKeys.forEach((key) => {
      filters[key].forEach((value) => {
        params.append(key, value);
      });
    });

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
    if (typeof window === "undefined") {
      return;
    }
    if (window.innerWidth < 1024) {
      setIsFilterRailCollapsed(true);
    }
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsFilterRailCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isFilterSheetOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFilterSheetOpen]);

  useEffect(() => {
    if (!isFilterSheetOpen || !pendingScrollKey) {
      return;
    }
    const element = document.getElementById(`filter-group-${pendingScrollKey}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingScrollKey(null);
    }
  }, [isFilterSheetOpen, pendingScrollKey]);

  const updateFilterValue = (key: FacetKey, value: string, include: boolean) => {
    setFilters((prev) => {
      const hasValue = prev[key].includes(value);
      if (include && hasValue) return prev;
      if (!include && !hasValue) return prev;
      const nextValues = include
        ? [...prev[key], value].sort((a, b) => a.localeCompare(b))
        : prev[key].filter((v) => v !== value);
      return { ...prev, [key]: nextValues, page: DEFAULT_PAGE };
    });
  };

  const clearFilterGroup = (key: FacetKey) => {
    setFilters((prev) => {
      if (prev[key].length === 0) return prev;
      return { ...prev, [key]: [], page: DEFAULT_PAGE };
    });
    setFilterSearches((prev) => ({ ...prev, [key]: "" }));
  };

  const resetFilters = () => {
    setFilters(createDefaultFilters());
    setFilterSearches(createEmptySearches());
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

  const activeFilters = useMemo(
    () =>
      facetKeys.flatMap((key) =>
        filters[key].map((value) => ({ key, value }))
      ),
    [filters]
  );

  const hasActiveFilters = activeFilters.length > 0;

  const trimmedQuery = filters.query.trim();
  const resultsCount = filteredGames.length;
  const heading =
    trimmedQuery.length > 0
      ? `Results for “${trimmedQuery}` + "”"
      : hasActiveFilters
        ? "Showing filtered games"
        : "Showing all games";
  const resultsSummary =
    resultsCount === 0
      ? "No games match your current filters."
      : `${resultsCount} game${resultsCount === 1 ? "" : "s"} ${trimmedQuery.length > 0 || hasActiveFilters
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

  const handleSuggestionSelect = (game: Game) => {
    setFilters((current) => ({
      ...current,
      query: game.name,
      page: DEFAULT_PAGE,
    }));
    setIsSearchFocused(false);
    inputRef.current?.blur();
  };

  const openFilterSheet = (key?: FacetKey) => {
    if (key) {
      setPendingScrollKey(key);
    }
    setIsFilterSheetOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-surface-sunken text-text-brand">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-6 px-4 py-10 lg:flex-nowrap lg:gap-10">
        <FilterSidebar
          filters={filters}
          facets={facets}
          filterSearches={filterSearches}
          setFilterSearches={setFilterSearches}
          isFilterRailCollapsed={isFilterRailCollapsed}
          setIsFilterRailCollapsed={setIsFilterRailCollapsed}
          isFilterSheetOpen={isFilterSheetOpen}
          closeFilterSheet={closeFilterSheet}
          resetFilters={resetFilters}
          updateFilterValue={updateFilterValue}
          clearFilterGroup={clearFilterGroup}
          openFilterSheet={openFilterSheet}
          initialExpandedFilters={initialExpandedFiltersRef.current ?? []}
        />

        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <header className="flex flex-wrap items-center gap-3 rounded-3xl border border-brand-sprout/20 bg-surface-raised p-4 shadow-sm backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-surface-highlight text-text-brand hover:bg-brand-sprout/20"
              onClick={() => setIsFilterRailCollapsed((prev) => !prev)}
              aria-label={
                isFilterRailCollapsed
                  ? "Expand filter navigation"
                  : "Collapse filter navigation"
              }
            >
              {isFilterRailCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>

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

            <Button
              type="button"
              variant="outline"
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border-brand-sprout/40 bg-white px-4 py-2 text-sm font-semibold text-text-brand hover:bg-brand-sprout/10 focus-visible:ring-brand-marigold"
              onClick={() => openFilterSheet()}
            >
              <Filter className="h-4 w-4 text-brand-sprout" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-1 rounded-full bg-surface-highlight px-2 py-1 text-[11px] font-semibold text-brand-sprout">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </header>

          <div className="rounded-3xl border border-brand-sprout/20 bg-surface-raised/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
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
            <p className="mt-2 text-sm text-text-brand/60">
              Use the menu button to collapse the filter rail or tap “Filters” to open it as a sheet.
            </p>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-brand-sprout/20 bg-surface-raised/90 p-4 shadow-sm backdrop-blur">
              <span className="text-sm font-medium text-text-brand/80">Active filters:</span>
              {activeFilters.map(({ key, value }) => {
                const label = filterMeta[key].label;
                return (
                  <Badge
                    key={`${key}-${value}`}
                    variant="secondary"
                    className="flex items-center gap-2 rounded-full bg-surface-highlight px-3 py-1 text-sm font-medium text-text-brand"
                  >
                    <span className="font-semibold text-brand-sprout">{label}:</span>
                    <span>{prettifyFilterValue(value)}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-brand-sprout transition hover:bg-brand-sprout/20"
                      onClick={() => updateFilterValue(key, value, false)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {prettifyFilterValue(value)}</span>
                    </button>
                  </Badge>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-8 px-3 text-xs font-semibold text-brand-sprout hover:bg-surface-highlight"
                onClick={resetFilters}
              >
                Clear all
              </Button>
            </div>
          )}

          <GameGrid games={paginatedGames} resetFilters={resetFilters} />

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
