// app/game-client.tsx
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Activity,
  ArrowRight,
  Baby,
  Brain,
  CircleDashed,
  Filter,
  PanelLeftClose,
  PanelLeftOpen,
  Globe2,
  Handshake,
  Map,
  MapPinned,
  MoonStar,
  Music,
  PartyPopper,
  School,
  Search as SearchIcon,
  Scissors,
  ScrollText,
  Sparkles,
  Tag,
  Users,
  UsersRound,
  Volleyball,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./game-client.module.css";

const fuseOptions = {
  keys: ["name", "description", "keywords"],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
};

const facetKeys = [
  "category",
  "tags",
  "traditionality",
  "prepLevel",
  "skillsDeveloped",
  "regionalPopularity",
] as const;

type FacetKey = (typeof facetKeys)[number];
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

const prettifyFilterValue = (value: string) => {
  if (value === value.toLowerCase()) {
    return value
      .split(/[-_]/)
      .map((part) =>
        part
          .split(" ")
          .map((word) =>
            word.length > 0
              ? word.charAt(0).toUpperCase() + word.slice(1)
              : word
          )
          .join(" ")
      )
      .join(" ");
  }
  return value;
};

const categoryIcons: Record<string, LucideIcon> = {
  Group: UsersRound,
  Party: PartyPopper,
  Wide: Map,
};

const tagIcons: Partial<Record<string, LucideIcon>> = {
  "wide-area": MapPinned,
  tag: Tag,
  circle: CircleDashed,
  memory: Brain,
  "classroom-friendly": School,
  active: Activity,
  ball: Volleyball,
  "hide-and-seek": SearchIcon,
  night: MoonStar,
  "paper-craft": Scissors,
  music: Music,
  teamwork: Handshake,
};

const filterMeta: Record<
  FacetKey,
  {
    label: string;
    description: string;
    icon: LucideIcon;
    optionIcons?: Partial<Record<string, LucideIcon>>;
    emphasizedSearch?: boolean;
  }
> = {
  category: {
    label: "Group",
    description: "Choose the type of group you're playing with.",
    icon: Users,
    optionIcons: categoryIcons,
  },
  tags: {
    label: "Type",
    description: "Pick the vibe or activity style.",
    icon: Tag,
    optionIcons: tagIcons,
  },
  traditionality: {
    label: "Traditionality",
    description: "Explore classics or contemporary twists.",
    icon: ScrollText,
  },
  prepLevel: {
    label: "Prep Level",
    description: "How much setup time do you have?",
    icon: Wrench,
  },
  skillsDeveloped: {
    label: "Skills",
    description: "Focus on the skills you want to encourage.",
    icon: Sparkles,
    emphasizedSearch: true,
  },
  regionalPopularity: {
    label: "Region",
    description: "See what's popular in different places.",
    icon: Globe2,
  },
};

const InfoItem = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-brand-sprout/10 px-3 py-2 text-sm font-medium text-brand-ink">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-sprout/20 text-brand-sprout">
      <Icon className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1 break-words">{label}</span>
  </div>
);

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
      : `${resultsCount} game${resultsCount === 1 ? "" : "s"} ${
          trimmedQuery.length > 0 || hasActiveFilters
            ? "matching your criteria"
            : "ready to explore"
        }`;

  const filterGroups = facetKeys
    .map((key) => {
      const meta = filterMeta[key];
      const options = [...(facets[key] ?? [])];
      return {
        ...meta,
        key,
        options,
        showSearch: meta.emphasizedSearch || options.length > 8,
      };
    })
    .filter((group) => group.options.length > 0);

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

  const formatPlayers = (game: Game) => {
    const { playersMin, playersMax } = game;
    if (typeof playersMin === "number" && typeof playersMax === "number") {
      return `${playersMin}\u2013${playersMax} players`;
    }
    if (typeof playersMin === "number") {
      return `${playersMin}+ players`;
    }
    if (typeof playersMax === "number") {
      return `Up to ${playersMax} players`;
    }
    return null;
  };

  const formatAges = (game: Game) => {
    const { ageMin, ageMax } = game;
    if (typeof ageMin === "number" && typeof ageMax === "number") {
      return `Ages ${ageMin}\u2013${ageMax}`;
    }
    if (typeof ageMin === "number") {
      return `Ages ${ageMin}+`;
    }
    if (typeof ageMax === "number") {
      return `Up to age ${ageMax}`;
    }
    return null;
  };

  const renderFilterPanel = (variant: "rail" | "sheet") => {
    const isSheet = variant === "sheet";
    return (
      <div className="flex h-full flex-col gap-6">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-brand-ink">
                Refine games
              </h2>
              <p className="text-sm text-brand-ink/70">
                Tailor filters to match your group.
              </p>
            </div>
            {isSheet ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-brand-sprout/10 text-brand-ink hover:bg-brand-sprout/20"
                onClick={closeFilterSheet}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs font-semibold text-brand-sprout hover:bg-brand-sprout/10"
                onClick={resetFilters}
              >
                Clear all
              </Button>
            ) : null}
          </div>
          <div className="h-px bg-brand-sprout/20" />
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <Accordion
            type="multiple"
            defaultValue={initialExpandedFiltersRef.current ?? []}
            className="flex flex-col gap-3"
          >
            {filterGroups.map((group) => {
              const {
                key,
                label,
                description,
                icon: Icon,
                optionIcons,
                options,
                showSearch,
              } = group;
              const selectedCount = filters[key].length;
              const searchTerm = filterSearches[key].toLowerCase().trim();
              const visibleOptions =
                searchTerm.length > 0
                  ? options.filter((option) =>
                      option.toLowerCase().includes(searchTerm)
                    )
                  : options;

              return (
                <AccordionItem
                  key={key}
                  value={key}
                  className="overflow-hidden rounded-2xl border border-brand-sprout/20 bg-white/80 shadow-sm"
                  id={`filter-group-${key}`}
                >
                  <AccordionTrigger className="px-4 text-left text-base font-semibold text-brand-ink hover:text-brand-sprout">
                    <span className="flex w-full items-center gap-2">
                      <Icon className="h-4 w-4 text-brand-sprout" />
                      <span>{label}</span>
                      {selectedCount > 0 && (
                        <Badge className="ml-auto rounded-full bg-brand-sprout/15 px-2 py-1 text-[11px] font-semibold text-brand-sprout">
                          {selectedCount}
                        </Badge>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <p className="mb-3 text-xs text-brand-ink/70">{description}</p>
                    {showSearch && (
                      <div className="relative mb-3">
                        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-sprout/70" />
                        <Input
                          value={filterSearches[key]}
                          onChange={(event) =>
                            setFilterSearches((prev) => ({
                              ...prev,
                              [key]: event.target.value,
                            }))
                          }
                          placeholder={`Search ${label.toLowerCase()}`}
                          className="h-9 rounded-full border border-brand-sprout/30 bg-white pl-9 text-sm focus-visible:ring-brand-marigold"
                        />
                      </div>
                    )}
                    <div className="space-y-2 overflow-hidden rounded-2xl border border-brand-sprout/20 bg-brand-parchment/60 p-2">
                      <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                        {visibleOptions.length > 0 ? (
                          visibleOptions.map((option) => {
                            const isChecked = filters[key].includes(option);
                            const OptionIcon = optionIcons?.[option];
                            return (
                              <label
                                key={option}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                                  isChecked
                                    ? "bg-brand-sprout/15 text-brand-ink shadow-inner"
                                    : "hover:bg-brand-sprout/10"
                                }`}
                              >
                                <Checkbox
                                  className="h-4 w-4 border-brand-sprout/50 data-[state=checked]:border-brand-sprout data-[state=checked]:bg-brand-sprout data-[state=checked]:text-white"
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    updateFilterValue(key, option, checked === true)
                                  }
                                />
                                {OptionIcon && (
                                  <OptionIcon className="h-4 w-4 text-brand-sprout" />
                                )}
                                <span className="flex-1 text-sm">
                                  {prettifyFilterValue(option)}
                                </span>
                              </label>
                            );
                          })
                        ) : (
                          <p className="px-3 py-6 text-center text-xs text-brand-ink/60">
                            No matches for “{filterSearches[key]}”.
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 h-8 px-3 text-xs font-semibold text-brand-sprout hover:bg-brand-sprout/10"
                        onClick={() => clearFilterGroup(key)}
                      >
                        Clear {label}
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
        {isSheet && (
          <div className="mt-auto flex flex-col gap-3 border-t border-brand-sprout/20 pt-4">
            <Button
              className="h-11 rounded-full bg-brand-marigold text-sm font-semibold text-brand-ink transition hover:bg-brand-marigold-dark"
              onClick={closeFilterSheet}
            >
              Apply filters
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full border-brand-sprout/40 bg-white text-sm font-semibold text-brand-sprout transition hover:bg-brand-sprout/10"
              onClick={() => {
                resetFilters();
                closeFilterSheet();
              }}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-brand-parchment/60 text-brand-ink">
      <div
        className={cn(
          styles.layout,
          styles.layoutSpacing,
          "mx-auto flex max-w-7xl flex-wrap gap-6 px-4 py-10 lg:flex-nowrap"
        )}
      >
        <aside
          className={cn(
            "flex flex-shrink-0 flex-col transition-all duration-300 ease-in-out",
            isFilterRailCollapsed ? "w-16" : "sm:w-64 lg:w-72"
          )}
        >
          <div
            className={cn(
              "sticky top-6 flex flex-col items-stretch",
              isFilterRailCollapsed
                ? "gap-4 rounded-3xl border border-brand-sprout/30 bg-white/80 p-3 shadow-sm backdrop-blur"
                : "rounded-3xl border border-brand-sprout/30 bg-white/80 p-4 shadow-sm backdrop-blur"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 self-end rounded-full bg-brand-sprout/10 text-brand-ink hover:bg-brand-sprout/20"
              onClick={() => setIsFilterRailCollapsed((prev) => !prev)}
              aria-label={
                isFilterRailCollapsed ? "Expand filters" : "Collapse filters"
              }
            >
              {isFilterRailCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
            {isFilterRailCollapsed ? (
              <div className="flex flex-1 flex-col items-center gap-2 py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-2xl bg-brand-sprout/15 text-brand-ink transition hover:bg-brand-sprout/25"
                  onClick={() => openFilterSheet()}
                  aria-label="Open filters"
                >
                  <Filter className="h-5 w-5 text-brand-sprout" />
                </Button>
                <div className="mt-2 flex flex-1 flex-col items-center gap-2">
                  {filterGroups.map((group) => {
                    const Icon = group.icon;
                    const selectedCount = filters[group.key].length;
                    return (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => openFilterSheet(group.key)}
                        className={cn(
                          "relative flex h-11 w-11 items-center justify-center rounded-2xl text-brand-ink transition",
                          selectedCount > 0
                            ? "bg-brand-sprout/20 text-brand-sprout"
                            : "bg-brand-parchment/60 hover:bg-brand-sprout/15"
                        )}
                        aria-label={`Edit ${group.label} filters`}
                      >
                        <Icon className="h-5 w-5" />
                        {selectedCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-marigold px-1 text-[11px] font-semibold text-brand-ink">
                            {selectedCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {renderFilterPanel("rail")}
              </div>
            )}
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <header className="flex flex-wrap items-center gap-3 rounded-3xl border border-brand-sprout/20 bg-white/80 p-4 shadow-sm backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-brand-sprout/10 text-brand-ink hover:bg-brand-sprout/20"
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
            <div className="relative flex-1 min-w-[220px]">
              <form
                onSubmit={handleSearchSubmit}
                className="flex h-11 items-center gap-3 rounded-full border border-brand-sprout/30 bg-white/90 px-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-marigold"
              >
                <SearchIcon className="h-5 w-5 text-brand-sprout" />
                <Input
                  ref={inputRef}
                  aria-label="Search games"
                  placeholder="Search by name, description, or keyword"
                  value={filters.query}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      query: event.target.value,
                      page: DEFAULT_PAGE,
                    }))
                  }
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 100)}
                  className="h-full flex-1 border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                />
                <Button
                  type="submit"
                  className="h-9 rounded-full bg-brand-marigold px-4 text-sm font-semibold text-brand-ink transition hover:bg-brand-marigold-dark"
                >
                  Search
                </Button>
              </form>
              {showSuggestions && (
                <div className="absolute inset-x-0 top-full z-30 mt-3 overflow-hidden rounded-2xl border border-brand-sprout/20 bg-white shadow-lg">
                  <ul className="divide-y divide-brand-sprout/20">
                    {suggestions.map((game) => (
                      <li key={game.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-brand-ink transition hover:bg-brand-sprout/10"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSuggestionSelect(game);
                          }}
                        >
                          <span className="font-medium">{game.name}</span>
                          {game.category && (
                            <Badge className="rounded-full bg-brand-sprout/15 px-2 py-1 text-[11px] font-semibold text-brand-sprout">
                              {prettifyFilterValue(game.category)}
                            </Badge>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border-brand-sprout/40 bg-white px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-sprout/10 focus-visible:ring-brand-marigold"
              onClick={() => openFilterSheet()}
            >
              <Filter className="h-4 w-4 text-brand-sprout" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-1 rounded-full bg-brand-sprout/15 px-2 py-1 text-[11px] font-semibold text-brand-sprout">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </header>
          <div className="rounded-3xl border border-brand-sprout/20 bg-white/70 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1
                  className={cn(
                    styles.heading,
                    "text-2xl font-semibold text-brand-ink"
                  )}
                >
                  {heading}
                </h1>
                <p className="mt-2 text-sm text-brand-ink/70">{resultsSummary}</p>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-ink/75">
              Discover activities that spark connection, collaboration, and laughs for every group size.
            </p>
            <p className="mt-2 text-sm text-brand-ink/60">
              Use the menu button to collapse the filter rail or tap “Filters” to open it as a sheet.
            </p>
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-brand-sprout/20 bg-white/70 p-4 shadow-sm backdrop-blur">
              <span className="text-sm font-medium text-brand-ink/80">Active filters:</span>
              {activeFilters.map(({ key, value }) => {
                const label = filterMeta[key].label;
                return (
                  <Badge
                    key={`${key}-${value}`}
                    variant="secondary"
                    className="flex items-center gap-2 rounded-full bg-brand-sprout/15 px-3 py-1 text-sm font-medium text-brand-ink"
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
                className="ml-auto h-8 px-3 text-xs font-semibold text-brand-sprout hover:bg-brand-sprout/10"
                onClick={resetFilters}
              >
                Clear all
              </Button>
            </div>
          )}
          {paginatedGames.length > 0 ? (
            <div className={cn(styles.gameGrid, "grid gap-6")}>
              {paginatedGames.map((game) => {
                const playersText = formatPlayers(game);
                const ageText = formatAges(game);
                const prepText = game.prepLevel ? prettifyFilterValue(game.prepLevel) : null;
                const traditionText = game.traditionality ? prettifyFilterValue(game.traditionality) : null;
                const description = game.description?.trim();
                const topSkills = (game.skillsDeveloped || []).slice(0, 3);
                const topRegions = (game.regionalPopularity || []).slice(0, 2);

                return (
                  <Link
                    key={game.id}
                    href={`/game/${game.id}`}
                    className="group flex h-full flex-col justify-between rounded-3xl border border-brand-sprout/25 bg-white/90 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-parchment/60"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h2
                            className={cn(
                              styles.cardTitle,
                              "text-lg font-semibold text-brand-ink transition-colors group-hover:text-brand-sprout"
                            )}
                          >
                            {game.name}
                          </h2>
                          {game.category && (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-sprout">
                              {prettifyFilterValue(game.category)}
                            </p>
                          )}
                        </div>
                        {game.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {game.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="rounded-full border-brand-sprout/30 bg-white px-3 py-1 text-xs font-medium text-brand-sprout"
                              >
                                #{prettifyFilterValue(tag)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm leading-6 text-brand-ink/75 line-clamp-4">
                        {description ||
                          "Discover the rules, twists, and fun variations for this game."}
                      </p>
                    </div>
                    <div className="mt-6 space-y-4">
                      <div className={cn(styles.infoGrid, "grid gap-3")}>
                        {playersText && <InfoItem icon={Users} label={playersText} />}
                        {ageText && <InfoItem icon={Baby} label={ageText} />}
                        {prepText && <InfoItem icon={Wrench} label={prepText} />}
                        {traditionText && <InfoItem icon={ScrollText} label={traditionText} />}
                      </div>
                      {(topSkills.length > 0 || topRegions.length > 0) && (
                        <div className="space-y-3 rounded-2xl border border-brand-sprout/20 bg-brand-parchment/60 p-4">
                          {topSkills.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-ink/70">
                                <Sparkles className="h-3.5 w-3.5 text-brand-marigold" />
                                Key skills
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {topSkills.map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="outline"
                                    className="rounded-full border-brand-sprout/30 bg-white px-3 py-1 text-xs font-medium text-brand-ink"
                                  >
                                    {prettifyFilterValue(skill)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {topRegions.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-ink/70">
                                <Globe2 className="h-3.5 w-3.5 text-brand-sprout" />
                                Popular in
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {topRegions.map((region) => (
                                  <Badge
                                    key={region}
                                    className="rounded-full bg-brand-sprout/15 px-3 py-1 text-xs font-medium text-brand-ink"
                                  >
                                    {region}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-sprout">
                      Explore game
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-sprout/40 bg-white/70 p-12 text-center shadow-inner">
              <Image
                src="/file.svg"
                alt="No games"
                width={120}
                height={120}
                className="mb-6 opacity-80"
              />
              <p className="mb-4 max-w-md text-base text-brand-ink/70">
                No games matched your filters. Try adjusting your search or start fresh.
              </p>
              <Button
                onClick={resetFilters}
                className="rounded-full bg-brand-marigold px-6 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-marigold-dark"
              >
                Reset filters
              </Button>
            </div>
          )}
          {totalPages > 1 && (
            <div className="space-y-4">
              <Pagination>
                <PaginationContent>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(i + 1);
                        }}
                        isActive={currentPage === i + 1}
                        className={`border border-brand-sprout/30 bg-white text-sm font-medium text-brand-ink hover:bg-brand-sprout/10 hover:text-brand-ink ${
                          currentPage === i + 1 ? "bg-brand-sprout/20" : ""
                        }`}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                </PaginationContent>
              </Pagination>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-full border-brand-sprout/40 bg-white px-5 text-sm font-semibold text-brand-ink hover:bg-brand-sprout/10"
                  onClick={() => handlePageChange(Math.max(DEFAULT_PAGE, currentPage - 1))}
                  disabled={currentPage === DEFAULT_PAGE}
                >
                  Previous
                </Button>
                <Button
                  className="rounded-full bg-brand-marigold px-5 text-sm font-semibold text-brand-ink transition hover:bg-brand-marigold-dark"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages || DEFAULT_PAGE, currentPage + 1))
                  }
                  disabled={currentPage === (totalPages || DEFAULT_PAGE)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
      {isFilterSheetOpen && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-end bg-brand-ink/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={closeFilterSheet}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l border-brand-sprout/30 bg-brand-parchment/60 px-6 pb-8 pt-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {renderFilterPanel("sheet")}
          </div>
        </div>
      )}
    </div>
  );
}


