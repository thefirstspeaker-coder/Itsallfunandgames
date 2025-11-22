import Link from "next/link";
import Image from "next/image";
import { Game } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, prettifyFilterValue } from "@/lib/utils";
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

interface GameCardProps {
    game: Game;
}

const InfoItem = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
    <div className="flex items-center gap-3 rounded-xl border border-brand-sprout/20 bg-surface-raised px-3 py-2 text-sm font-medium text-text-brand shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-highlight text-brand-sprout">
            <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 break-words leading-snug">{label}</span>
    </div>
);

export function GameCard({ game }: GameCardProps) {
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

    const playersText = formatPlayers(game);
    const ageText = formatAges(game);
    const prepText = game.prepLevel ? prettifyFilterValue(game.prepLevel) : null;
    const traditionText = game.traditionality
        ? prettifyFilterValue(game.traditionality)
        : null;
    const description = game.description?.trim();
    const topSkills = (game.skillsDeveloped || []).slice(0, 3);
    const topRegions = (game.regionalPopularity || []).slice(0, 2);

    return (
        <Card
            asChild
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border-brand-sprout/25 bg-card p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-background supports-[backdrop-filter]:bg-card/80 dark:border-brand-sprout/30"
        >
            <Link
                href={`/game/${game.id}`}
                className="flex h-full flex-col justify-between text-left text-inherit no-underline"
            >
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-sprout/0 via-brand-sprout/5 to-brand-marigold/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="relative flex flex-1 flex-col gap-6">
                    <header className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                                {game.category && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-surface-highlight px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-sprout">
                                        {prettifyFilterValue(game.category)}
                                    </span>
                                )}
                                <h2 className="font-heading text-xl font-semibold text-text-brand transition-colors group-hover:text-brand-sprout sm:text-2xl">
                                    {game.name}
                                </h2>
                            </div>
                            {game.tags.length > 0 && (
                                <div className="flex flex-wrap justify-end gap-2">
                                    {game.tags.slice(0, 2).map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="rounded-full border-brand-sprout/25 bg-surface-raised px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-brand-sprout"
                                        >
                                            #{prettifyFilterValue(tag)}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-sm leading-6 text-text-brand/75 line-clamp-4">
                            {description ||
                                "Discover the rules, twists, and fun variations for this game."}
                        </p>
                    </header>

                    <div className="space-y-4">
                        <div className="space-y-3 rounded-2xl border border-brand-sprout/20 bg-surface-sunken p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-brand/70">
                                <Sparkles className="h-3.5 w-3.5 text-brand-marigold" />
                                Quick facts
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {playersText && <InfoItem icon={Users} label={playersText} />}
                                {ageText && <InfoItem icon={Baby} label={ageText} />}
                                {prepText && <InfoItem icon={Wrench} label={prepText} />}
                                {traditionText && (
                                    <InfoItem icon={ScrollText} label={traditionText} />
                                )}
                            </div>
                        </div>

                        {(topSkills.length > 0 || topRegions.length > 0) && (
                            <div className="space-y-3 rounded-2xl border border-brand-sprout/15 bg-surface-raised p-4 shadow-sm">
                                {topSkills.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-brand/70">
                                            <Sparkles className="h-3.5 w-3.5 text-brand-marigold" />
                                            Key skills
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {topSkills.map((skill) => (
                                                <Badge
                                                    key={skill}
                                                    variant="outline"
                                                    className="rounded-full border-brand-sprout/25 bg-surface-sunken px-3 py-1 text-[11px] font-medium text-text-brand"
                                                >
                                                    {prettifyFilterValue(skill)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {topRegions.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-brand/70">
                                            <Globe2 className="h-3.5 w-3.5 text-brand-sprout" />
                                            Popular in
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {topRegions.map((region) => (
                                                <Badge
                                                    key={region}
                                                    className="rounded-full bg-surface-highlight px-3 py-1 text-[11px] font-medium text-text-brand"
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
                </div>

                <div className="relative mt-6 flex items-center justify-between border-t border-brand-sprout/20 pt-4 text-sm font-semibold text-brand-sprout">
                    <span className="inline-flex items-center gap-2">
                        Explore game
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-text-brand/60">
                        Learn the full rules
                    </span>
                </div>
            </Link>
        </Card>
    );
}
