import Image from "next/image";
import { Game } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prettifyFilterValue } from "@/lib/utils";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface GameCardProps {
  game: Game;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onTagToggle: (value: string, include: boolean) => void;
  activeTags: Set<string>;
}

const toRange = (min?: number | null, max?: number | null) => {
  if (typeof min === "number" && typeof max === "number") return `${min}–${max}`;
  if (typeof min === "number") return `${min}+`;
  if (typeof max === "number") return `Up to ${max}`;
  return null;
};

export function GameCard({ game, isBookmarked, onToggleBookmark, onTagToggle, activeTags }: GameCardProps) {
  const metadata = [
    toRange(game.playersMin, game.playersMax) && { label: "Players", value: toRange(game.playersMin, game.playersMax) as string },
    toRange(game.ageMin, game.ageMax) && { label: "Age", value: toRange(game.ageMin, game.ageMax) as string },
    game.category && { label: "Category", value: prettifyFilterValue(game.category) },
    game.prepLevel && { label: "Prep", value: prettifyFilterValue(game.prepLevel) },
    game.equipment && { label: "Equipment", value: game.equipment },
    ...(game.skillsDeveloped || []).map((s) => ({ label: "Skill", value: prettifyFilterValue(s) })),
    ...(game.tags || []).map((t) => ({ label: "Tag", value: prettifyFilterValue(t), rawValue: t })),
    ...(game.regionalPopularity || []).map((r) => ({ label: "Region", value: prettifyFilterValue(r) })),
    game.traditionality && { label: "Type", value: prettifyFilterValue(game.traditionality) },
  ].filter(Boolean) as { label: string; value: string; rawValue?: string }[];

  return (
    <Card className="overflow-hidden rounded-3xl border border-brand-sprout/25 bg-surface-raised shadow-md transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-brand-sprout/15 via-brand-marigold/15 to-brand-coral/20">
        {game.image ? (
          <Image src={game.image} alt={game.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-center">
            <div>
              <p className="text-lg font-semibold text-text-brand/80">{game.name}</p>
              <p className="text-sm text-text-brand/60">Image coming soon</p>
            </div>
          </div>
        )}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={isBookmarked ? `Remove ${game.name} from bookmarks` : `Bookmark ${game.name}`}
          onClick={() => onToggleBookmark(game.id)}
          className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/90"
        >
          {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-brand-sprout" /> : <Bookmark className="h-4 w-4" />}
        </Button>
      </div>
      <div className="space-y-4 p-5">
        <h2 className="text-2xl font-bold text-text-brand">{game.name}</h2>
        <p className="line-clamp-3 text-sm text-text-brand/75">{game.description || "A playful activity for your next group session."}</p>
        <div className="flex flex-wrap gap-2">
          {metadata.map((item, index) => {
            const key = `${item.label}-${item.value}-${index}`;
            const raw = item.rawValue;
            const selected = raw ? activeTags.has(raw) : false;
            return (
              <button
                key={key}
                type="button"
                onClick={() => raw && onTagToggle(raw, !selected)}
                disabled={!raw}
                className="disabled:cursor-default"
              >
                <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${selected ? "bg-brand-sprout text-white" : "bg-surface-highlight text-text-brand"}`}>
                  <span className="mr-1 opacity-75">{item.label}:</span>{item.value}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
