import { games } from "@/lib/loadGames";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { prettifyFilterValue } from "@/lib/utils";
import {
  ArrowLeft,
  Baby,
  Clock,
  Globe2,
  ScrollText,
  Sparkles,
  Users,
  Wrench,
  LucideIcon,
} from "lucide-react";

type Props = {
  params: { id: string };
};

export async function generateStaticParams() {
  return games.map((game) => ({
    id: game.id,
  }));
}

const formatRange = (
  min: number | null | undefined,
  max: number | null | undefined,
  suffix: string
) => {
  if (min == null && max == null) return null;
  if (min != null && max != null)
    return min === max ? `${min} ${suffix}` : `${min}\u2013${max} ${suffix}`;
  if (min != null) return `${min}+ ${suffix}`;
  if (max != null) return `Up to ${max} ${suffix}`;
  return null;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-brand-sprout/20 bg-surface-raised p-4 shadow-sm transition-all hover:border-brand-sprout/40 hover:shadow-md">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-highlight text-brand-sprout">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-brand/60">
        {label}
      </p>
      <p className="mt-0.5 font-medium text-text-brand">{value}</p>
    </div>
  </div>
);

export default function GameDetailPage({ params }: Props) {
  const game = games.find((g) => g.id === params.id);

  if (!game) {
    notFound();
  }

  const ageRange = formatRange(game.ageMin, game.ageMax, "years");
  const playerRange = formatRange(game.playersMin, game.playersMax, "players");
  const prepText = game.prepLevel ? prettifyFilterValue(game.prepLevel) : null;
  const traditionText = game.traditionality
    ? prettifyFilterValue(game.traditionality)
    : null;

  return (
    <div className="min-h-screen bg-surface-sunken pb-20">
      {/* Header / Hero */}
      <header className="relative overflow-hidden bg-surface-raised pb-12 pt-24 shadow-sm lg:pt-32">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
        <div
          className="absolute inset-0 bg-gradient-to-b from-brand-sprout/5 to-transparent"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/Itsallfunandgames">
              <Button
                variant="ghost"
                className="group -ml-4 gap-2 text-text-brand/60 hover:text-brand-sprout"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to all games
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {game.category && (
                  <Badge className="rounded-full bg-brand-marigold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-ink hover:bg-brand-marigold/30">
                    {prettifyFilterValue(game.category)}
                  </Badge>
                )}
                {game.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-full border-brand-sprout/30 bg-white/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-sprout"
                  >
                    #{prettifyFilterValue(tag)}
                  </Badge>
                ))}
              </div>
              <h1 className="font-heading text-4xl font-bold text-text-brand sm:text-5xl lg:text-6xl">
                {game.name}
              </h1>
              {game.description && (
                <p className="max-w-2xl text-lg leading-relaxed text-text-brand/80">
                  {game.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto -mt-8 max-w-5xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Sidebar / Stats (Left on Desktop) */}
          <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {playerRange && (
                <StatCard icon={Users} label="Players" value={playerRange} />
              )}
              {ageRange && (
                <StatCard icon={Baby} label="Age Range" value={ageRange} />
              )}
              {prepText && (
                <StatCard icon={Wrench} label="Prep Level" value={prepText} />
              )}
              {traditionText && (
                <StatCard
                  icon={ScrollText}
                  label="Traditionality"
                  value={traditionText}
                />
              )}
            </div>

            {(game.skillsDeveloped?.length ?? 0) > 0 && (
              <div className="rounded-3xl border border-brand-sprout/20 bg-surface-raised p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-brand/60">
                  <Sparkles className="h-4 w-4 text-brand-marigold" />
                  Skills Developed
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.skillsDeveloped?.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="rounded-md bg-surface-highlight px-2.5 py-1 text-xs font-medium text-text-brand"
                    >
                      {prettifyFilterValue(skill)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(game.regionalPopularity?.length ?? 0) > 0 && (
              <div className="rounded-3xl border border-brand-sprout/20 bg-surface-raised p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-brand/60">
                  <Globe2 className="h-4 w-4 text-brand-sprout" />
                  Popular In
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.regionalPopularity?.map((region) => (
                    <Badge
                      key={region}
                      variant="outline"
                      className="rounded-md border-brand-sprout/20 bg-white px-2.5 py-1 text-xs font-medium text-text-brand"
                    >
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content (Right on Desktop) */}
          <div className="space-y-8 lg:col-span-8">
            {/* Rules Section */}
            {game.generalRules && game.generalRules.length > 0 && (
              <section className="rounded-3xl border border-brand-sprout/20 bg-surface-raised p-6 shadow-sm sm:p-8">
                <h2 className="mb-6 font-heading text-2xl font-bold text-text-brand">
                  How to Play
                </h2>
                <div className="prose prose-stone max-w-none prose-headings:font-heading prose-headings:font-semibold prose-p:text-text-brand/80 prose-li:text-text-brand/80 prose-strong:text-text-brand">
                  {(() => {
                    const cleanedRules = game.generalRules
                      .map((rule) => rule.trim())
                      .filter((rule) => rule.length > 0);

                    if (cleanedRules.length === 0) return null;

                    const combinedRules = cleanedRules.reduce(
                      (acc, rule, index) => {
                        if (index === 0) return rule;
                        const previous = cleanedRules[index - 1];
                        const currentIsListItem = /^(\d+\.|[-*+])\s/.test(rule);
                        const previousIsListItem = previous
                          ? /^(\d+\.|[-*+])\s/.test(previous)
                          : false;
                        const separator =
                          currentIsListItem && previousIsListItem
                            ? "\n"
                            : "\n\n";
                        return `${acc}${separator}${rule}`;
                      },
                      ""
                    );

                    return <Markdown content={combinedRules} />;
                  })()}
                </div>
              </section>
            )}

            {/* Equipment Section */}
            {game.equipment && (
              <section className="rounded-3xl border border-brand-sprout/20 bg-surface-raised p-6 shadow-sm sm:p-8">
                <h2 className="mb-4 font-heading text-xl font-bold text-text-brand">
                  Equipment Needed
                </h2>
                <p className="text-text-brand/80">{game.equipment}</p>
              </section>
            )}

            {/* Variations Section */}
            {game.variations && game.variations.length > 0 && (
              <section className="rounded-3xl border border-brand-sprout/20 bg-surface-raised p-6 shadow-sm sm:p-8">
                <h2 className="mb-6 font-heading text-xl font-bold text-text-brand">
                  Variations
                </h2>
                <ul className="space-y-4">
                  {game.variations.map((variation, index) => (
                    <li
                      key={index}
                      className="flex gap-4 rounded-xl bg-surface-sunken/50 p-4"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-marigold/20 text-xs font-bold text-brand-ink">
                        {index + 1}
                      </span>
                      <span className="text-text-brand/80">{variation}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
