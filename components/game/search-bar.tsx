import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Game } from "@/lib/types";
import { prettifyFilterValue } from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";
import { FormEvent, RefObject } from "react";

interface SearchBarProps {
    query: string;
    setQuery: (query: string) => void;
    isSearchFocused: boolean;
    setIsSearchFocused: (focused: boolean) => void;
    showSuggestions: boolean;
    suggestions: Game[];
    handleSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
    handleSuggestionSelect: (game: Game) => void;
    inputRef: RefObject<HTMLInputElement | null>;
}

export function SearchBar({
    query,
    setQuery,
    isSearchFocused,
    setIsSearchFocused,
    showSuggestions,
    suggestions,
    handleSearchSubmit,
    handleSuggestionSelect,
    inputRef,
}: SearchBarProps) {
    return (
        <div className="relative w-full">
            <form
                onSubmit={handleSearchSubmit}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/15 bg-black/20 p-2 shadow-sm backdrop-blur-md focus-within:border-brand-marigold/60 focus-within:ring-2 focus-within:ring-brand-marigold/40"
            >
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <SearchIcon className="h-5 w-5 shrink-0 text-brand-sprout" />
                    <Input
                        ref={inputRef}
                        aria-label="Search games"
                        placeholder="Search by name, description, or keyword"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 100)}
                        className="h-full flex-1 border-none bg-transparent p-0 text-sm text-text-brand placeholder:text-text-brand/55 focus-visible:ring-0"
                    />
                </div>
                <Button
                    type="submit"
                    className="h-11 gap-2 rounded-xl bg-brand-marigold px-5 text-sm font-semibold text-brand-ink transition hover:bg-brand-marigold-dark focus-visible:ring-2 focus-visible:ring-brand-marigold/70"
                >
                    <SearchIcon className="h-4 w-4" />
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
                                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-text-brand transition hover:bg-brand-sprout/10"
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        handleSuggestionSelect(game);
                                    }}
                                >
                                    <span className="font-medium">{game.name}</span>
                                    {game.category && (
                                        <Badge className="rounded-full bg-surface-highlight px-2 py-1 text-[11px] font-semibold text-brand-sprout">
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
    );
}
