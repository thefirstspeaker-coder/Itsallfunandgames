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
        <div className="relative flex-1 min-w-[220px]">
            <form
                onSubmit={handleSearchSubmit}
                className="flex h-11 items-center gap-3 rounded-full border border-brand-sprout/30 bg-surface-raised px-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-marigold"
            >
                <SearchIcon className="h-5 w-5 text-brand-sprout" />
                <Input
                    ref={inputRef}
                    aria-label="Search games"
                    placeholder="Search by name, description, or keyword"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
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
