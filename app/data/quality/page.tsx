import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  games,
  normaliseNullishString,
  rawGames,
  slugify,
  trimStrings,
} from '@/lib/loadGames';
import { GameSchema, type Game } from '@/lib/types';

type UnknownRecord = Record<string, unknown>;

interface AnalysedGame {
  index: number;
  derivedId: string;
  explicitId: string | null;
  rawName: string | null;
  normalisedName: string;
  issues: string[];
  warnings: string[];
  validationIssues: string[];
  included: boolean;
  duplicateCount?: number;
}

interface DuplicateGroup {
  id: string;
  count: number;
  names: string[];
  indices: number[];
}

interface CoverageMetric {
  label: string;
  present: number;
  total: number;
}

interface QualityReport {
  totalRecords: number;
  includedCount: number;
  excludedCount: number;
  flaggedRecords: AnalysedGame[];
  duplicateGroups: DuplicateGroup[];
  coverageMetrics: CoverageMetric[];
  coverageGaps: CoverageMetric[];
}

const hasContent = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const percentage = (present: number, total: number) =>
  total === 0 ? 0 : Math.round((present / total) * 1000) / 10;

const formatCount = (count: number, singular: string, plural: string) =>
  `${count.toLocaleString()} ${count === 1 ? singular : plural}`;

const buildQualityReport = (): QualityReport => {
  const analysed: AnalysedGame[] = [];
  const seenIds = new Set<string>();
  const firstOccurrence = new Map<string, number>();

  rawGames.forEach((rawGame, index) => {
    const entry: AnalysedGame = {
      index,
      derivedId: '',
      explicitId: null,
      rawName: null,
      normalisedName: '',
      issues: [],
      warnings: [],
      validationIssues: [],
      included: false,
    };

    if (!rawGame || typeof rawGame !== 'object' || Array.isArray(rawGame)) {
      entry.issues.push('Entry is not a valid object and cannot be parsed.');
      analysed.push(entry);
      return;
    }

    const trimmedGame = trimStrings(rawGame) as UnknownRecord;

    const rawNameValue =
      typeof trimmedGame.name === 'string' ? trimmedGame.name : undefined;
    entry.rawName = typeof rawNameValue === 'string' ? rawNameValue : null;
    const normalisedName = normaliseNullishString(rawNameValue) ?? '';
    entry.normalisedName = normalisedName;

    const explicitIdValue =
      typeof trimmedGame.id === 'string' ? trimmedGame.id : undefined;
    entry.explicitId = explicitIdValue && explicitIdValue.length > 0 ? explicitIdValue : null;

    const derivedId =
      explicitIdValue && explicitIdValue.length > 0
        ? explicitIdValue
        : rawNameValue
        ? slugify(rawNameValue)
        : '';

    entry.derivedId = derivedId;

    if (!derivedId) {
      entry.issues.push('Unable to derive a stable id from the available data.');
    }

    const ageMinRaw =
      typeof trimmedGame.ageMin === 'number' ? trimmedGame.ageMin : undefined;
    const ageMaxRaw =
      typeof trimmedGame.ageMax === 'number' ? trimmedGame.ageMax : undefined;
    const playersMinRaw =
      typeof trimmedGame.playersMin === 'number' ? trimmedGame.playersMin : undefined;
    const playersMaxRaw =
      typeof trimmedGame.playersMax === 'number' ? trimmedGame.playersMax : undefined;

    let ageMin = ageMinRaw;
    let ageMax = ageMaxRaw;
    if (typeof ageMin === 'number' && typeof ageMax === 'number' && ageMin > ageMax) {
      entry.warnings.push(`Age range inverted (${ageMin}–${ageMax}); values swapped.`);
      [ageMin, ageMax] = [ageMax, ageMin];
    }

    let playersMin = playersMinRaw;
    let playersMax = playersMaxRaw;
    if (
      typeof playersMin === 'number' &&
      typeof playersMax === 'number' &&
      playersMin > playersMax
    ) {
      entry.warnings.push(
        `Player range inverted (${playersMin}–${playersMax}); values swapped.`,
      );
      [playersMin, playersMax] = [playersMax, playersMin];
    }

    const descriptionStr =
      typeof trimmedGame.description === 'string' ? trimmedGame.description : null;
    const categoryStr =
      typeof trimmedGame.category === 'string' ? trimmedGame.category : null;
    const prepLevelStr =
      typeof trimmedGame.prepLevel === 'string' ? trimmedGame.prepLevel : null;

    const candidate: UnknownRecord = {
      ...trimmedGame,
      id: derivedId,
      name: normalisedName,
      description: normaliseNullishString(descriptionStr),
      category: normaliseNullishString(categoryStr),
      prepLevel: normaliseNullishString(prepLevelStr),
      ageMin,
      ageMax,
      playersMin,
      playersMax,
    };

    const validation = GameSchema.safeParse(candidate);
    if (!validation.success) {
      entry.validationIssues = validation.error.issues.map(issue => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      });
    } else {
      entry.included = true;
    }

    if (derivedId) {
      if (!seenIds.has(derivedId)) {
        seenIds.add(derivedId);
        firstOccurrence.set(derivedId, index);
      } else {
        const firstIndex = firstOccurrence.get(derivedId);
        entry.issues.push(
          firstIndex !== undefined
            ? `Duplicate id; first seen at entry #${firstIndex + 1}.`
            : 'Duplicate id encountered.',
        );
        entry.included = false;
      }
    } else {
      entry.included = false;
    }

    if (entry.validationIssues.length > 0) {
      entry.included = false;
    }

    analysed.push(entry);
  });

  const idBuckets = new Map<string, AnalysedGame[]>();
  analysed.forEach(record => {
    if (!record.derivedId) return;
    const bucket = idBuckets.get(record.derivedId);
    if (bucket) {
      bucket.push(record);
    } else {
      idBuckets.set(record.derivedId, [record]);
    }
  });

  const duplicateGroups: DuplicateGroup[] = [];
  idBuckets.forEach((records, id) => {
    if (records.length > 1) {
      const first = records[0];
      if (first) {
        first.warnings.push(
          `ID shared with ${records.length - 1} other record${records.length - 1 === 1 ? '' : 's'}.`,
        );
      }
      records.forEach(record => {
        record.duplicateCount = records.length;
      });
      duplicateGroups.push({
        id,
        count: records.length,
        names: records.map(record => record.normalisedName || record.rawName || '(unnamed)'),
        indices: records.map(record => record.index + 1),
      });
    }
  });

  duplicateGroups.sort((a, b) => {
    if (b.count === a.count) {
      return Math.min(...a.indices) - Math.min(...b.indices);
    }
    return b.count - a.count;
  });

  const flaggedRecords = analysed
    .filter(
      record =>
        record.issues.length > 0 ||
        record.warnings.length > 0 ||
        record.validationIssues.length > 0,
    )
    .sort((a, b) => {
      if (a.included === b.included) {
        return a.index - b.index;
      }
      return a.included ? 1 : -1;
    });

  const includedCount = analysed.filter(record => record.included).length;
  const totalRecords = rawGames.length;

  const coverageMetrics = createCoverageMetrics(games);
  const coverageGaps = coverageMetrics
    .filter(metric => metric.total > 0 && metric.present < metric.total)
    .sort((a, b) => a.present / a.total - b.present / b.total)
    .slice(0, 3);

  return {
    totalRecords,
    includedCount,
    excludedCount: totalRecords - includedCount,
    flaggedRecords,
    duplicateGroups,
    coverageMetrics,
    coverageGaps,
  };
};

const createCoverageMetrics = (dataset: Game[]): CoverageMetric[] => {
  const total = dataset.length;
  const metrics: CoverageMetric[] = [
    {
      label: 'Descriptions',
      present: dataset.filter(game => hasContent(game.description)).length,
      total,
    },
    {
      label: 'Equipment details',
      present: dataset.filter(game => hasContent(game.equipment)).length,
      total,
    },
    {
      label: 'Recommended player notes',
      present: dataset.filter(game => hasContent(game.recommendedPlayersText)).length,
      total,
    },
    {
      label: 'Age guidance provided',
      present: dataset.filter(game => game.ageMin !== null || game.ageMax !== null).length,
      total,
    },
    {
      label: 'Player counts provided',
      present: dataset.filter(game => game.playersMin !== null || game.playersMax !== null).length,
      total,
    },
    {
      label: 'General rules listed',
      present: dataset.filter(game => game.generalRules.length > 0).length,
      total,
    },
    {
      label: 'Variations captured',
      present: dataset.filter(game => game.variations.length > 0).length,
      total,
    },
    {
      label: 'Skills developed noted',
      present: dataset.filter(game => game.skillsDeveloped.length > 0).length,
      total,
    },
    {
      label: 'Regional popularity noted',
      present: dataset.filter(game => game.regionalPopularity.length > 0).length,
      total,
    },
    {
      label: 'Historical notes present',
      present: dataset.filter(game => hasContent(game.historicalNotes)).length,
      total,
    },
    {
      label: 'External links added',
      present: dataset.filter(game => game.links.length > 0).length,
      total,
    },
    {
      label: 'Keyword tags applied',
      present: dataset.filter(game => game.keywords.length > 0).length,
      total,
    },
  ];

  return metrics;
};

const qualityReport = buildQualityReport();

const getDisplayName = (record: AnalysedGame) =>
  record.normalisedName || record.rawName || `Record #${record.index + 1}`;

export default function DataQualityDiagnosticsPage() {
  const {
    totalRecords,
    includedCount,
    excludedCount,
    flaggedRecords,
    duplicateGroups,
    coverageMetrics,
    coverageGaps,
  } = qualityReport;

  return (
    <section className="space-y-10">
      <header className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Data Health Overview
        </p>
        <h1 className="text-3xl font-heading">Data Quality Diagnostics</h1>
        <p className="max-w-3xl text-muted-foreground">
          This report inspects the source data in <code>public/games.json</code>,
          highlighting which records make it into the catalogue, where
          validation failed, and which fields still need attention.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Games in source file
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Raw records available for ingestion.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published in catalogue
            </CardTitle>
            <CardDescription>
              {formatCount(excludedCount, 'record', 'records')} dropped during normalisation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold">{includedCount.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {percentage(includedCount, totalRecords)}% of source data passes validation.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Records flagged for review
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold">{flaggedRecords.length.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Includes duplicates, invalid entries, and range corrections.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duplicate ID clusters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold">{duplicateGroups.length.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Resolve to ensure each game has a unique stable id.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="text-xl">Data completeness</CardTitle>
          <CardDescription>
            Coverage across the published games. Fields with lower coverage are prioritised below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {coverageMetrics.map(metric => (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{metric.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {metric.present}/{metric.total}
                  </span>
                </div>
                <Progress value={percentage(metric.present, metric.total)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {coverageGaps.length > 0 && (
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="text-xl">Suggested next actions</CardTitle>
            <CardDescription>
              Focus on the lowest coverage fields to improve the breadth of each game entry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              {coverageGaps.map(metric => {
                const remaining = metric.total - metric.present;
                return (
                  <li key={metric.label}>
                    Add details for {formatCount(remaining, 'more game', 'more games')} with
                    missing <span className="font-medium text-foreground">{metric.label.toLowerCase()}</span>{' '}
                    to lift coverage from {percentage(metric.present, metric.total)}%.
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      {duplicateGroups.length > 0 && (
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="text-xl">Duplicate identifiers</CardTitle>
            <CardDescription>
              Each group shares the same derived id. Update the ids or titles so every game is unique.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Derived id</TableHead>
                  <TableHead className="w-24">Records</TableHead>
                  <TableHead>Entries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicateGroups.map(group => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-xs">{group.id}</code>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{group.count}</TableCell>
                    <TableCell>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {group.names.map((name, idx) => (
                          <div key={`${group.id}-${idx}`} className="space-y-1">
                            <div className="font-medium text-foreground">{name}</div>
                            <div className="text-xs text-muted-foreground">
                              Entry #{group.indices[idx].toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="text-xl">Records needing attention</CardTitle>
          <CardDescription>
            Validation failures, duplicate ids, and range corrections identified during import.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {flaggedRecords.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              Great news—no outstanding issues were detected in the source file.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-64">Record</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedRecords.map(record => (
                  <TableRow key={`${record.derivedId || 'record'}-${record.index}`}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{getDisplayName(record)}</div>
                        <div className="text-xs text-muted-foreground">
                          Entry #{(record.index + 1).toLocaleString()} · id{' '}
                          {record.derivedId ? (
                            <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                              {record.derivedId}
                            </code>
                          ) : (
                            '—'
                          )}
                          {record.explicitId && record.explicitId !== record.derivedId && (
                            <span className="ml-2 text-muted-foreground">
                              (explicit id {record.explicitId})
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={record.included ? 'secondary' : 'destructive'}>
                          {record.included ? 'Included in catalogue' : 'Excluded'}
                        </Badge>
                        {record.duplicateCount && record.duplicateCount > 1 && (
                          <Badge variant="outline">
                            {record.duplicateCount}× duplicate
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {record.validationIssues.map((issue, idx) => (
                          <div
                            key={`validation-${record.index}-${idx}`}
                            className="flex flex-wrap items-start gap-2"
                          >
                            <Badge variant="destructive">Validation</Badge>
                            <span className="text-sm text-muted-foreground">{issue}</span>
                          </div>
                        ))}
                        {record.issues.map((issue, idx) => (
                          <div
                            key={`issue-${record.index}-${idx}`}
                            className="flex flex-wrap items-start gap-2"
                          >
                            <Badge variant="destructive">Issue</Badge>
                            <span className="text-sm text-muted-foreground">{issue}</span>
                          </div>
                        ))}
                        {record.warnings.map((warning, idx) => (
                          <div
                            key={`warning-${record.index}-${idx}`}
                            className="flex flex-wrap items-start gap-2"
                          >
                            <Badge variant="secondary">Warning</Badge>
                            <span className="text-sm text-muted-foreground">{warning}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
