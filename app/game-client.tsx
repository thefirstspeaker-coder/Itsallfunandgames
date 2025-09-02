// app/game-client.tsx
"use client";

import { Game } from "@/lib/types";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const fuseOptions = {
  keys: ["name", "description", "keywords"],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
};

type Facets = Record<string, string[]>;

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

  const [filters, setFilters] = useState({
    query: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    tags: searchParams.get("tags") || "",
    traditionality: searchParams.get("traditionality") || "",
    prepLevel: searchParams.get("prepLevel") || "",
    skillsDeveloped: searchParams.get("skillsDeveloped") || "",
    regionalPopularity: searchParams.get("regionalPopularity") || "",
    page: Number(searchParams.get("page")) || 1,
  });

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
    router.replace(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router, currentPage]);

  const handlePageChange = (page: number) => {
    setFilters((f) => ({ ...f, page }));
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
      page: 1,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
        <Input
          aria-label="Search games"
          placeholder="Search by name..."
          value={filters.query}
          onChange={(e) =>
            setFilters((f) => ({ ...f, query: e.target.value, page: 1 }))
          }
          className="md:w-64"
        />
        <Select
          value={filters.category}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, category: value, page: 1 }))
          }
        >
          <SelectTrigger className="w-40" aria-label="Group">
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
            setFilters((f) => ({ ...f, tags: value, page: 1 }))
          }
        >
          <SelectTrigger className="w-40" aria-label="Type">
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
            setFilters((f) => ({ ...f, traditionality: value, page: 1 }))
          }
        >
          <SelectTrigger className="w-40" aria-label="Traditionality">
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
            setFilters((f) => ({ ...f, prepLevel: value, page: 1 }))
          }
        >
          <SelectTrigger className="w-40" aria-label="Prep level">
            <SelectValue placeholder="Prep level" />
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
            setFilters((f) => ({ ...f, skillsDeveloped: value, page: 1 }))
          }
        >
          <SelectTrigger className="w-40" aria-label="Skill">
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
            setFilters((f) => ({ ...f, regionalPopularity: value, page: 1 }))
          }
        >
          <SelectTrigger className="w-40" aria-label="Region">
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
      </div>

      {paginatedGames.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedGames.map((game) => (
            <Card
              key={game.id}
              className="transition-transform hover:-translate-y-1 hover:shadow-subtle"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">
                  <Link href={`/game/${game.id}`} className="hover:underline">
                    {game.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {game.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {typeof game.ageMin === "number" && (
                    <Badge variant="secondary">
                      Ages {game.ageMin}
                      {typeof game.ageMax === "number" ? `–${game.ageMax}` : "+"}
                    </Badge>
                  )}
                  {typeof game.playersMin === "number" && (
                    <Badge variant="secondary">
                      {game.playersMin}
                      {typeof game.playersMax === "number"
                        ? `–${game.playersMax}`
                        : "+"} players
                    </Badge>
                  )}
                  {game.prepLevel && (
                    <Badge variant="secondary">{game.prepLevel}</Badge>
                  )}
                  {game.traditionality && (
                    <Badge variant="secondary">{game.traditionality}</Badge>
                  )}
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
              </CardContent>
            </Card>
          ))}
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
        <Pagination className="pt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(Math.max(1, currentPage - 1));
                }}
              />
            </PaginationItem>
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
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(Math.min(totalPages, currentPage + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

