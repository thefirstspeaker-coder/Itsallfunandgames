import Image from "next/image";
import { Game } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prettifyFilterValue } from "@/lib/utils";
import { Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, PointerEvent } from "react";
import { FacetKey } from "@/lib/constants";

interface GameCardProps {
  game: Game;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onMetaToggle: (facet: FacetKey, value: string, include: boolean) => void;
  activeFilters: Partial<Record<FacetKey, Set<string>>>;
}

const toRange = (min?: number | null, max?: number | null) => {
  if (typeof min === "number" && typeof max === "number") return `${min}–${max}`;
  if (typeof min === "number") return `${min}+`;
  if (typeof max === "number") return `Up to ${max}`;
  return null;
};

export function GameCard({ game, isBookmarked, onToggleBookmark, onMetaToggle, activeFilters }: GameCardProps) {
  const card3dStyle = {
    "--rotate-x": "0deg",
    "--rotate-y": "0deg",
    "--glare-x": "50%",
    "--glare-y": "50%",
  } as CSSProperties;

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;
    const rotateX = (0.5 - py) * 8;
    const rotateY = (px - 0.5) * 8;

    card.style.setProperty("--rotate-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--rotate-y", `${rotateY.toFixed(2)}deg`);
    card.style.setProperty("--glare-x", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--glare-y", `${(py * 100).toFixed(1)}%`);
  };

  const resetPointerState = (card: HTMLElement) => {
    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");
    card.style.setProperty("--glare-x", "50%");
    card.style.setProperty("--glare-y", "50%");
  };

  const imageSrc = (() => {
    if (!game.image) return null;
    if (game.image.startsWith("http://") || game.image.startsWith("https://")) {
      return game.image;
    }
    if (game.image.startsWith("/Itsallfunandgames/")) {
      return game.image;
    }
    if (game.image.startsWith("/")) {
      return `/Itsallfunandgames${game.image}`;
    }
    return `/Itsallfunandgames/${game.image}`;
  })();

  const metadata = [
    toRange(game.playersMin, game.playersMax) && { facet: "playersRange" as FacetKey, value: toRange(game.playersMin, game.playersMax) as string, tone: "bg-cyan-500/25" },
    toRange(game.ageMin, game.ageMax) && { facet: "ageRange" as FacetKey, value: toRange(game.ageMin, game.ageMax) as string, tone: "bg-violet-500/25" },
    game.prepLevel && { facet: "prepLevel" as FacetKey, value: game.prepLevel, displayValue: prettifyFilterValue(game.prepLevel), tone: "bg-amber-500/25" },
    game.category && { facet: "category" as FacetKey, value: game.category, displayValue: prettifyFilterValue(game.category), tone: "bg-emerald-500/25" },
    game.equipment && { facet: "equipmentNeeded" as FacetKey, value: "Equipment needed", displayValue: "Equipment needed", tone: "bg-rose-500/25" },
    ...(game.skillsDeveloped || []).map((s) => ({ facet: "skillsDeveloped" as FacetKey, value: s, displayValue: prettifyFilterValue(s), tone: "bg-indigo-500/25" })),
    ...(game.tags || []).map((t) => ({ facet: "tags" as FacetKey, value: t, displayValue: prettifyFilterValue(t), tone: "bg-teal-500/25" })),
  ].filter(Boolean) as { facet: FacetKey; value: string; displayValue?: string; tone: string }[];

  return (
    <Card
      style={card3dStyle}
      onPointerMove={handlePointerMove}
      onPointerLeave={(event) => resetPointerState(event.currentTarget)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          resetPointerState(event.currentTarget);
        }
      }}
      className="game-card-3d w-full max-w-[400px] overflow-hidden rounded-3xl border border-brand-sprout/25 bg-surface-raised"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-brand-sprout/15 via-brand-marigold/15 to-brand-coral/20">
        {imageSrc ? (
          <Image src={imageSrc} alt={game.name} fill className="object-cover" />
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
      <div className="flex min-h-[360px] flex-col space-y-4 p-5">
        <h2 className="text-2xl font-bold text-text-brand">
          <Link href={`/game/${game.id}`} className="hover:underline focus-visible:underline">
            {game.name}
          </Link>
        </h2>
        <p className="line-clamp-3 text-sm text-text-brand/75">{game.description || "A playful activity for your next group session."}</p>
        <div className="flex flex-wrap gap-2">
          {metadata.map((item, index) => {
            const key = `${item.facet}-${item.value}-${index}`;
            const selected = activeFilters[item.facet]?.has(item.value) ?? false;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onMetaToggle(item.facet, item.value, !selected)}
              >
                <Badge className={`rounded-full px-3 py-1 text-xs font-semibold text-text-brand ${selected ? "bg-brand-sprout text-white" : item.tone}`}>
                  {item.displayValue ?? item.value}
                </Badge>
              </button>
            );
          })}
        </div>
        <div className="pt-1">
          <Link
            href={`/game/${game.id}`}
            className="inline-flex rounded-full bg-brand-marigold px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-marigold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sprout"
          >
            View game details
          </Link>
        </div>
      </div>
    </Card>
  );
}
