import { Button } from "@/components/ui/button";
import { Game } from "@/lib/types";
import Image from "next/image";
import { GameCard } from "./game-card";
import styles from "@/app/game-client.module.css";
import { cn } from "@/lib/utils";

interface GameGridProps {
    games: Game[];
    resetFilters: () => void;
}

export function GameGrid({ games, resetFilters }: GameGridProps) {
    if (games.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-sprout/40 bg-surface-raised p-12 text-center shadow-inner">
                <Image
                    src="/file.svg"
                    alt="No games"
                    width={120}
                    height={120}
                    className="mb-6 opacity-80"
                />
                <p className="mb-4 max-w-md text-base text-text-brand/70">
                    No games matched your filters. Try adjusting your search or start fresh.
                </p>
                <Button
                    onClick={resetFilters}
                    className="rounded-full bg-brand-marigold px-6 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-marigold-dark"
                >
                    Reset filters
                </Button>
            </div>
        );
    }

    return (
        <div className={cn(styles.gameGrid, "grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3")}>
            {games.map((game) => (
                <GameCard key={game.id} game={game} />
            ))}
        </div>
    );
}
