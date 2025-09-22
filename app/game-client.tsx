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
  type FormEvent,
} from "react";
import { useDebounce } from "use-debounce";
import Fuse from "fuse.js";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Baby,
  Brain,
  CircleDashed,
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

// Playful palettes for card frames/buttons
const palettes = [
  {
    frame: "from-amber-400 to-yellow-300",
    accent: "bg-amber-500 hover:bg-amber-600",
    subtle: "bg-amber-50",
  },
  {
    frame: "from-rose-400 to-red-300",
    accent: "bg-rose-500 hover:bg-rose-600",
    subtle: "bg-rose-50",
  },
  {
    frame: "from-teal-400 to-emerald-300",
    accent: "bg-teal-500 hover:bg-teal-600",
    subtle: "bg-teal-50",
  },
  {
    frame: "from-sky-400 to-blue-300",
    accent: "bg-sky-500 hover:bg-sky-600",
    subtle: "bg-sky-50",
  },
  {
    frame: "from-violet-400 to-fuchsia-300",
    accent: "bg-violet-500 hover:bg-violet-600",
    subtle: "bg-violet-50",
  },
  {
    frame: "from-lime-400 to-green-300",
    accent: "bg-lime-500 hover:bg-lime-600",
    subtle: "bg-lime-50",
  },
];

const getPalette = (id?: string) =>
  palettes[Math.abs(id?.length || 0) % palettes.length];

const InfoItem = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
  <div className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-white/90 px-3 py-2 text-sm font-medium text-foreground shadow-sm">
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
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

  return (
    <div className="grid gap-10 lg:grid-cols-[320px,1fr]">
      <aside className="space-y-6 rounded-3xl border border-border bg-white/80 p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Refine games</h2>
            <p className="text-sm text-muted-foreground">
              Mix and match filters to find the perfect play.
            </p>
          </div>
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-rose-600 hover:bg-rose-50"
              onClick={resetFilters}
            >
              Clear all
            </Button>
          ) : null}
        </div>
        <Accordion
          type="multiple"
          defaultValue={initialExpandedFiltersRef.current ?? []}
          className="space-y-3"
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
                className="border-none rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5"
              >
                <AccordionTrigger className="px-4 text-left text-base font-semibold">
                  <span className="flex w-full items-center gap-2">
                    <Icon className="h-4 w-4 text-rose-500" />
                    <span>{label}</span>
                    {selectedCount > 0 && (
                      <Badge className="ml-auto rounded-full bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-600">
                        {selectedCount}
                      </Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <p className="mb-3 text-xs text-muted-foreground">{description}</p>
                  {showSearch && (
                    <div className="relative mb-3">
                      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={filterSearches[key]}
                        onChange={(event) =>
                          setFilterSearches((prev) => ({
                            ...prev,
                            [key]: event.target.value,
                          }))
                        }
                        placeholder={`Search ${label.toLowerCase()}`}
                        className="h-9 rounded-full border border-border bg-white pl-9 text-sm shadow-none focus-visible:ring-rose-400/40"
                      />
                    </div>
                  )}
                  <div className="space-y-2 overflow-hidden rounded-2xl border border-border/60 bg-white/90 p-2 shadow-inner">
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
                                  ? "bg-rose-50 text-rose-700 shadow-sm"
                                  : "hover:bg-rose-50/70"
                              }`}
                            >
                              <Checkbox
                                className="h-4 w-4 border-rose-300 data-[state=checked]:bg-rose-500"
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  updateFilterValue(key, option, checked === true)
                                }
                              />
                              {OptionIcon && (
                                <OptionIcon className="h-4 w-4 text-rose-500" />
                              )}
                              <span className="flex-1 text-sm text-foreground">
                                {prettifyFilterValue(option)}
                              </span>
                            </label>
                          );
                        })
                      ) : (
                        <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                          No matches for “{filterSearches[key]}”.
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 h-8 px-3 text-xs text-rose-600 hover:bg-rose-50"
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
      </aside>
      <div className="space-y-8">
        <div className="relative">
          <div className="relative mx-auto w-full max-w-3xl">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-3 rounded-full border border-border bg-white/90 px-5 py-3 shadow-sm ring-1 ring-black/5 focus-within:ring-rose-400/50"
            >
              <SearchIcon className="h-5 w-5 text-rose-500" />
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
                className="h-10 flex-1 border-none bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                className="h-10 rounded-full bg-rose-500 px-5 text-white hover:bg-rose-600"
              >
                Search
              </Button>
            </form>
            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full z-20 mt-3 overflow-hidden rounded-2xl border border-border bg-white/95 shadow-xl backdrop-blur">
                <ul className="divide-y divide-border">
                  {suggestions.map((game) => (
                    <li key={game.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-rose-50"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSuggestionSelect(game);
                        }}
                      >
                        <span className="font-medium text-foreground">
                          {game.name}
                        </span>
                        {game.category && (
                          <Badge className="rounded-full bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-600">
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
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
            <span className="text-sm font-medium text-muted-foreground">
              Active filters:
            </span>
            {activeFilters.map(({ key, value }) => {
              const label = filterMeta[key].label;
              return (
                <Badge
                  key={`${key}-${value}`}
                  variant="secondary"
                  className="flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-sm text-rose-600"
                >
                  <span className="font-medium text-rose-700">{label}:</span>
                  <span>{prettifyFilterValue(value)}</span>
                  <button
                    type="button"
                    className="rounded-full p-0.5 text-rose-500 transition hover:bg-rose-100 hover:text-rose-600"
                    onClick={() => updateFilterValue(key, value, false)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">
                      Remove {prettifyFilterValue(value)}
                    </span>
                  </button>
                </Badge>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 px-3 text-xs text-rose-600 hover:bg-rose-50"
              onClick={resetFilters}
            >
              Clear all
            </Button>
          </div>
        )}
        {paginatedGames.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedGames.map((game) => {
              const palette = getPalette(game.id);
              const playersText = formatPlayers(game);
              const ageText = formatAges(game);
              const prepText = game.prepLevel
                ? prettifyFilterValue(game.prepLevel)
                : null;
              const traditionText = game.traditionality
                ? prettifyFilterValue(game.traditionality)
                : null;
              const description = game.description?.trim();
              const topSkills = (game.skillsDeveloped || []).slice(0, 3);
              const topRegions = (game.regionalPopularity || []).slice(0, 2);

              return (
                <Card
                  key={game.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-white/95 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-1 rounded-b-full bg-gradient-to-r ${palette.frame} opacity-80`}
                  />
                  <CardHeader className="flex flex-col gap-4 px-6 pt-6 pb-0">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-rose-600 md:text-xl lg:text-2xl">
                          <Link
                            href={`/game/${game.id}`}
                            className="line-clamp-2 break-words"
                          >
                            {game.name}
                          </Link>
                        </CardTitle>
                      </div>
                      {game.category && (
                        <Badge className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
                          {prettifyFilterValue(game.category)}
                        </Badge>
                      )}
                    </div>
                    {game.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {game.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="rounded-full border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-600"
                          >
                            #{prettifyFilterValue(tag)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-6 px-6 pb-6 pt-4">
                    <div className="space-y-4">
                      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                        {description ||
                          "Discover the rules, twists, and fun variations for this game."}
                      </p>
                      <div
                        className={`rounded-2xl border border-border/40 p-4 shadow-inner ${palette.subtle}`}
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          {playersText && <InfoItem icon={Users} label={playersText} />}
                          {ageText && <InfoItem icon={Baby} label={ageText} />}
                          {prepText && <InfoItem icon={Wrench} label={prepText} />}
                          {traditionText && (
                            <InfoItem icon={ScrollText} label={traditionText} />
                          )}
                        </div>
                      </div>
                    </div>
                    {(topSkills.length > 0 || topRegions.length > 0) && (
                      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
                        {topSkills.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                              Key skills
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {topSkills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="rounded-full border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-600"
                                >
                                  {prettifyFilterValue(skill)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {topRegions.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <Globe2 className="h-3.5 w-3.5 text-emerald-500" />
                              Popular in
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {topRegions.map((region) => (
                                <Badge
                                  key={region}
                                  variant="secondary"
                                  className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700"
                                >
                                  {region}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-auto">
                      <Button
                        asChild
                        className={`w-full rounded-full text-base font-semibold text-white ${palette.accent}`}
                      >
                        <Link href={`/game/${game.id}`}>View Game</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-rose-200 bg-white/60 p-12 text-center shadow-inner">
            <Image
              src="/file.svg"
              alt="No games"
              width={120}
              height={120}
              className="mb-6 opacity-80"
            />
            <p className="mb-4 max-w-md text-base text-muted-foreground">
              No games matched your filters. Try adjusting your search or start fresh.
            </p>
            <Button
              onClick={resetFilters}
              className="rounded-full bg-rose-500 px-5 text-white hover:bg-rose-600"
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
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
            <div className="flex items-center justify-center gap-3">
              <Button
                className="rounded-full bg-rose-100 px-5 text-rose-700 hover:bg-rose-200"
                onClick={() =>
                  handlePageChange(Math.max(DEFAULT_PAGE, currentPage - 1))
                }
                disabled={currentPage === DEFAULT_PAGE}
              >
                Previous
              </Button>
              <Button
                className="rounded-full bg-emerald-500 px-5 text-white hover:bg-emerald-600"
                onClick={() =>
                  handlePageChange(
                    Math.min(totalPages || DEFAULT_PAGE, currentPage + 1)
                  )
                }
                disabled={currentPage === (totalPages || DEFAULT_PAGE)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

