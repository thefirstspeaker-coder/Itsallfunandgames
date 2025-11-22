import Link from "next/link";
import { Game } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prettifyFilterValue } from "@/lib/utils";
import {
    ArrowRight,
    Baby,
    Globe2,
    ScrollText,
    Sparkles,
    Users,
    Wrench,
    LucideIcon,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface GameCardProps {
    game: Game;
}

const InfoItem = ({
    icon: Icon,
    label,
    tooltip,
}: {
    icon: LucideIcon;
    label: string;
    tooltip: string;
}) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 text-sm font-medium text-text-brand/80 cursor-help">
                    <Icon className="h-4 w-4 text-brand-sprout" />
                    <span className="truncate">{label}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

export function GameCard({ game }: GameCardProps) {
    const formatPlayers = (game: Game) => {
        const { playersMin, playersMax } = game;
        if (typeof playersMin === "number" && typeof playersMax === "number") {
            return `${playersMin}\u2013${playersMax}`;
        }
        if (typeof playersMin === "number") {
            return `${playersMin}+`;
        }
        if (typeof playersMax === "number") {
            return `Up to ${playersMax}`;
        }
        return null;
    };

    const formatAges = (game: Game) => {
        const { ageMin, ageMax } = game;
        if (typeof ageMin === "number" && typeof ageMax === "number") {
            return `${ageMin}\u2013${ageMax}`;
        }
        if (typeof ageMin === "number") {
            return `${ageMin}+`;
        }
        if (typeof ageMax === "number") {
            return `Up to ${ageMax}`;
        }
        return null;
    };

    const playersText = formatPlayers(game);
    const ageText = formatAges(game);
    const prepText = game.prepLevel ? prettifyFilterValue(game.prepLevel) : null;
    const description = game.description?.trim();
    const topSkills = (game.skillsDeveloped || []).slice(0, 3);

    return (
        <Card
            asChild
            className="group relative flex h-full flex-col overflow-hidden rounded-[32px] border-brand-sprout/20 bg-surface-raised p-0 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-sprout/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-marigold focus-visible:ring-offset-2"
        >
            <Link
                href={`/game/${game.id}`}
                className="flex h-full flex-col text-left text-inherit no-underline"
            >
                <div className="flex flex-1 flex-col p-5">
                    <header className="mb-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5">
                                {game.category && (
                                    <span className="inline-flex items-center rounded-full bg-brand-sprout/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-sprout">
                                        {prettifyFilterValue(game.category)}
                                    </span>
                                )}
                                <h2 className="font-heading text-xl font-bold text-text-brand transition-colors group-hover:text-brand-sprout sm:text-2xl line-clamp-2">
                                    {game.name}
                                </h2>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-text-brand/70 line-clamp-3">
                            {description ||
                                "Discover the rules, twists, and fun variations for this game."}
                        </p>
                    </header>

                    <div className="mt-auto space-y-4">
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 rounded-2xl bg-surface-sunken/50 p-3">
                            {playersText && (
                                <InfoItem
                                    icon={Users}
                                    label={playersText}
                                    tooltip="Number of players"
                                />
                            )}
                            {ageText && (
                                <InfoItem
                                    icon={Baby}
                                    label={ageText}
                                    tooltip="Recommended age"
                                />
                            )}
                            {prepText && (
                                <InfoItem
                                    icon={Wrench}
                                    label={prepText}
                                    tooltip="Preparation level"
                                />
                            )}
                            {game.traditionality && (
                                <InfoItem
                                    icon={ScrollText}
                                    label={prettifyFilterValue(game.traditionality)}
                                    tooltip="Game style"
                                />
                            )}
                        </div>

                        {topSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {topSkills.map((skill) => (
                                    <Badge
                                        key={skill}
                                        variant="secondary"
                                        className="rounded-md bg-surface-highlight px-2 py-0.5 text-[10px] font-semibold text-text-brand/80 transition-colors group-hover:bg-brand-sprout/10 group-hover:text-brand-sprout"
                                    >
                                        {prettifyFilterValue(skill)}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative flex items-center justify-between border-t border-brand-sprout/10 bg-surface-sunken/30 px-5 py-3 text-sm font-semibold text-brand-sprout transition-colors group-hover:bg-brand-sprout/5">
                    <span className="inline-flex items-center gap-2">
                        View details
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
            </Link>
        </Card>
    );
}
