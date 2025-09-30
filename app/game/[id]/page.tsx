// app/game/[id]/page.tsx
import { games } from '@/lib/loadGames';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Markdown } from '@/components/markdown';

type Props = {
  params: { id: string };
};

// Generate static pages for all games at build time
export async function generateStaticParams() {
  return games.map((game) => ({
    id: game.id,
  }));
}

// Helper to format ranges
const formatRange = (min: number | null | undefined, max: number | null | undefined, suffix: string) => {
    if (min == null && max == null) return null;
    if (min != null && max != null) return min === max ? `${min} ${suffix}` : `${min}-${max} ${suffix}`;
    if (min != null) return `${min}+ ${suffix}`;
    if (max != null) return `Up to ${max} ${suffix}`;
    return null;
}

export default function GameDetailPage({ params }: Props) {
  const game = games.find((g) => g.id === params.id);

  if (!game) {
    notFound();
  }

  const ageRange = formatRange(game.ageMin, game.ageMax, 'years');
  const playerRange = formatRange(game.playersMin, game.playersMax, 'players');

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-4xl font-bold">{game.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {game.category && <Badge>{game.category}</Badge>}
            {ageRange && <span>Ages: {ageRange}</span>}
            {playerRange && <span>Players: {playerRange}</span>}
        </div>
      </header>
      <section className="mt-4 prose dark:prose-invert">
        {game.description && (
          <p>{game.description}</p>
        )}

        {game.generalRules && game.generalRules.length > 0 && (
          <div>
            <h3>Rules</h3>
            <ol>
              {game.generalRules.map((rule, i) => (
                <li key={i}>
                  <Markdown content={rule} />
                </li>
              ))}
            </ol>
          </div>
        )}

        {game.equipment && (
          <div>
            <h3>Equipment</h3>
            <p>{game.equipment}</p>
          </div>
        )}

        {game.variations && game.variations.length > 0 && (
          <div>
            <h3>Variations</h3>
            <ul>
              {game.variations.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {game.skillsDeveloped && game.skillsDeveloped.length > 0 && (
          <div>
            <h3>Skills Developed</h3>
            <ul>
              {game.skillsDeveloped.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </article>
  );
}
