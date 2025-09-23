// app/game-client.tsx
"use client";

import { Game } from "@/lib/types";
import {
  useSearchParams,
  useRouter,
  usePathname,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useRef,
  type CSSProperties,
  type FormEvent,
} from "react";
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
  <div className="flex items-center gap-3 rounded-2xl bg-[#80B380]/10 px-3 py-2 text-sm font-medium text-[#4B4B4B]">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#80B380]/20 text-[#80B380]">
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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const closeMobileFilters = () => setIsMobileFiltersOpen(false);
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
    if (!isMobileFiltersOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileFiltersOpen]);

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

  const renderFilterPanel = (variant: "desktop" | "mobile") => {
    const isMobile = variant === "mobile";
    return (
      <div className="flex h-full flex-col gap-6">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4B4B4B]">
                Refine games
              </h2>
              <p className="text-sm text-[#4B4B4B]/70">
                Search and tailor filters to match your group.
              </p>
            </div>
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-[#80B380]/10 text-[#4B4B4B] hover:bg-[#80B380]/20"
                onClick={closeMobileFilters}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs font-semibold text-[#80B380] hover:bg-[#80B380]/10"
                onClick={resetFilters}
              >
                Clear all
              </Button>
            ) : null}
          </div>
          <div className="relative">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-3 rounded-full border border-[#80B380]/30 bg-white/90 px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-[#F0A763]"
            >
              <SearchIcon className="h-5 w-5 text-[#80B380]" />
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
                className="h-9 flex-1 border-none bg-transparent p-0 text-sm focus-visible:ring-0"
              />
              <Button
                type="submit"
                className="h-9 rounded-full bg-[#F0A763] px-4 text-sm font-semibold text-[#4B4B4B] transition hover:bg-[#e6964f]"
              >
                Search
              </Button>
            </form>
            {showSuggestions && (
              <div className="absolute inset-x-0 top-full z-20 mt-3 overflow-hidden rounded-2xl border border-[#80B380]/20 bg-white shadow-lg">
                <ul className="divide-y divide-[#80B380]/20">
                  {suggestions.map((game) => (
                    <li key={game.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-[#4B4B4B] transition hover:bg-[#80B380]/10"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSuggestionSelect(game);
                        }}
                      >
                        <span className="font-medium">{game.name}</span>
                        {game.category && (
                          <Badge className="rounded-full bg-[#80B380]/15 px-2 py-1 text-[11px] font-semibold text-[#80B380]">
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
                  className="overflow-hidden rounded-2xl border border-[#80B380]/20 bg-white/80 shadow-sm"
                >
                  <AccordionTrigger className="px-4 text-left text-base font-semibold text-[#4B4B4B] hover:text-[#80B380]">
                    <span className="flex w-full items-center gap-2">
                      <Icon className="h-4 w-4 text-[#80B380]" />
                      <span>{label}</span>
                      {selectedCount > 0 && (
                        <Badge className="ml-auto rounded-full bg-[#80B380]/15 px-2 py-1 text-[11px] font-semibold text-[#80B380]">
                          {selectedCount}
                        </Badge>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <p className="mb-3 text-xs text-[#4B4B4B]/70">{description}</p>
                    {showSearch && (
                      <div className="relative mb-3">
                        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#80B380]/70" />
                        <Input
                          value={filterSearches[key]}
                          onChange={(event) =>
                            setFilterSearches((prev) => ({
                              ...prev,
                              [key]: event.target.value,
                            }))
                          }
                          placeholder={`Search ${label.toLowerCase()}`}
                          className="h-9 rounded-full border border-[#80B380]/30 bg-white pl-9 text-sm focus-visible:ring-[#F0A763]"
                        />
                      </div>
                    )}
                    <div className="space-y-2 overflow-hidden rounded-2xl border border-[#80B380]/20 bg-[#F9F7E8]/60 p-2">
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
                                    ? "bg-[#80B380]/15 text-[#4B4B4B] shadow-inner"
                                    : "hover:bg-[#80B380]/10"
                                }`}
                              >
                                <Checkbox
                                  className="h-4 w-4 border-[#80B380]/50 data-[state=checked]:border-[#80B380] data-[state=checked]:bg-[#80B380] data-[state=checked]:text-white"
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    updateFilterValue(key, option, checked === true)
                                  }
                                />
                                {OptionIcon && (
                                  <OptionIcon className="h-4 w-4 text-[#80B380]" />
                                )}
                                <span className="flex-1 text-sm">
                                  {prettifyFilterValue(option)}
                                </span>
                              </label>
                            );
                          })
                        ) : (
                          <p className="px-3 py-6 text-center text-xs text-[#4B4B4B]/60">
                            No matches for “{filterSearches[key]}”.
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 h-8 px-3 text-xs font-semibold text-[#80B380] hover:bg-[#80B380]/10"
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
        {isMobile && (
          <div className="mt-auto flex flex-col gap-3 border-t border-[#80B380]/20 pt-4">
            <Button
              className="h-11 rounded-full bg-[#F0A763] text-sm font-semibold text-[#4B4B4B] transition hover:bg-[#e6964f]"
              onClick={closeMobileFilters}
            >
              Apply filters
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full border-[#80B380]/40 bg-white text-sm font-semibold text-[#80B380] transition hover:bg-[#80B380]/10"
              onClick={() => {
                resetFilters();
                closeMobileFilters();
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
    <div
      className="relative min-h-screen bg-[#F9F7E8] text-[#4B4B4B]"
      style={{ "--focus-ring": "#F0A763" } as CSSProperties}
    >
      <div
        className={cn(
          styles.layout,
          styles.layoutSpacing,
          "mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10"
        )}
      >
        <aside className={cn(styles.desktopFilters, "w-full max-w-xs flex-shrink-0")}>
          <div className="sticky top-6 rounded-3xl border border-[#80B380]/30 bg-white/80 p-6 shadow-sm backdrop-blur">
            {renderFilterPanel("desktop")}
          </div>
        </aside>
        <main className="flex w-full flex-1 flex-col gap-8">
          <div className="rounded-3xl border border-[#80B380]/20 bg-white/70 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className={cn(styles.heading, "text-2xl font-semibold text-[#4B4B4B]")}>{heading}</h1>
                <p className="mt-2 text-sm text-[#4B4B4B]/70">{resultsSummary}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  styles.mobileFiltersButton,
                  "items-center gap-2 rounded-full border-[#80B380]/40 bg-white px-4 py-2 text-sm font-semibold text-[#4B4B4B] hover:bg-[#80B380]/10 focus-visible:ring-[#F0A763]"
                )}
                onClick={() => setIsMobileFiltersOpen(true)}
              >
                <Filter className="h-4 w-4 text-[#80B380]" />
                Filters
              </Button>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#4B4B4B]/75">
              Discover activities that spark connection, collaboration, and laughs for every group size.
            </p>
            <p className={cn(styles.mobileHint, "mt-2 text-sm text-[#4B4B4B]/60")}>
              Tap “Filters” to search games and refine the results.
            </p>
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-[#80B380]/20 bg-white/70 p-4 shadow-sm backdrop-blur">
              <span className="text-sm font-medium text-[#4B4B4B]/80">Active filters:</span>
              {activeFilters.map(({ key, value }) => {
                const label = filterMeta[key].label;
                return (
                  <Badge
                    key={`${key}-${value}`}
                    variant="secondary"
                    className="flex items-center gap-2 rounded-full bg-[#80B380]/15 px-3 py-1 text-sm font-medium text-[#4B4B4B]"
                  >
                    <span className="font-semibold text-[#80B380]">{label}:</span>
                    <span>{prettifyFilterValue(value)}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-[#80B380] transition hover:bg-[#80B380]/20"
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
                className="ml-auto h-8 px-3 text-xs font-semibold text-[#80B380] hover:bg-[#80B380]/10"
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
                    className="group flex h-full flex-col justify-between rounded-3xl border border-[#80B380]/25 bg-white/90 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A763] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F7E8]"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h2
                            className={cn(
                              styles.cardTitle,
                              "text-lg font-semibold text-[#4B4B4B] transition-colors group-hover:text-[#80B380]"
                            )}
                          >
                            {game.name}
                          </h2>
                          {game.category && (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#80B380]">
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
                                className="rounded-full border-[#80B380]/30 bg-white px-3 py-1 text-xs font-medium text-[#80B380]"
                              >
                                #{prettifyFilterValue(tag)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm leading-6 text-[#4B4B4B]/75 line-clamp-4">
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
                        <div className="space-y-3 rounded-2xl border border-[#80B380]/20 bg-[#F9F7E8]/80 p-4">
                          {topSkills.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#4B4B4B]/70">
                                <Sparkles className="h-3.5 w-3.5 text-[#F0A763]" />
                                Key skills
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {topSkills.map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="outline"
                                    className="rounded-full border-[#80B380]/30 bg-white px-3 py-1 text-xs font-medium text-[#4B4B4B]"
                                  >
                                    {prettifyFilterValue(skill)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {topRegions.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#4B4B4B]/70">
                                <Globe2 className="h-3.5 w-3.5 text-[#80B380]" />
                                Popular in
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {topRegions.map((region) => (
                                  <Badge
                                    key={region}
                                    className="rounded-full bg-[#80B380]/15 px-3 py-1 text-xs font-medium text-[#4B4B4B]"
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
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#80B380]">
                      Explore game
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#80B380]/40 bg-white/70 p-12 text-center shadow-inner">
              <Image
                src="/file.svg"
                alt="No games"
                width={120}
                height={120}
                className="mb-6 opacity-80"
              />
              <p className="mb-4 max-w-md text-base text-[#4B4B4B]/70">
                No games matched your filters. Try adjusting your search or start fresh.
              </p>
              <Button
                onClick={resetFilters}
                className="rounded-full bg-[#F0A763] px-6 py-2 text-sm font-semibold text-[#4B4B4B] transition hover:bg-[#e6964f]"
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
                        className={`border border-[#80B380]/30 bg-white text-sm font-medium text-[#4B4B4B] hover:bg-[#80B380]/10 hover:text-[#4B4B4B] ${
                          currentPage === i + 1 ? "bg-[#80B380]/20" : ""
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
                  className="rounded-full border-[#80B380]/40 bg-white px-5 text-sm font-semibold text-[#4B4B4B] hover:bg-[#80B380]/10"
                  onClick={() => handlePageChange(Math.max(DEFAULT_PAGE, currentPage - 1))}
                  disabled={currentPage === DEFAULT_PAGE}
                >
                  Previous
                </Button>
                <Button
                  className="rounded-full bg-[#F0A763] px-5 text-sm font-semibold text-[#4B4B4B] transition hover:bg-[#e6964f]"
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
      {isMobileFiltersOpen && (
        <div
          className={cn(
            styles.mobileFiltersOverlay,
            "fixed inset-0 z-40 flex items-start justify-end bg-[#4B4B4B]/40 backdrop-blur-sm"
          )}
          role="dialog"
          aria-modal="true"
          onClick={closeMobileFilters}
        >
          <div
            className={cn(
              styles.mobileFiltersSheet,
              "h-full w-full max-w-md overflow-y-auto border-l border-[#80B380]/30 bg-[#F9F7E8] px-6 pb-8 pt-6 shadow-2xl"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {renderFilterPanel("mobile")}
          </div>
        </div>
      )}
    </div>
  );
}


