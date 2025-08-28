// app/data/quality/page.tsx
import { rawGames } from '@/lib/loadGames';
import { GameSchema } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { get } from 'lodash';

interface Issue {
  id: string | number;
  name: string;
  field: string;
  issue: string;
  value: unknown;
}

export default function DataQualityPage() {
  const issues: Issue[] = [];
  let validCount = 0;

  rawGames.forEach((game: { [key: string]: unknown }, index: number) => {
    const result = GameSchema.safeParse(game);
    // Prioritise the game's unique 'id' for a consistent identifier.
    const identifier = game.id || `Row ${index + 1}`;
    
    if (result.success) {
      validCount++;
    } else {
      result.error.issues.forEach((issue, issueIndex) => {
        const fieldPath = issue.path.join('.');
        issues.push({
          // Use a composite key for better stability in dynamic lists.
          id: `${identifier}-${issueIndex}`,
          name: (game.name as string) || 'N/A',
          field: fieldPath,
          issue: issue.message,
          // Use lodash.get for safely accessing nested properties.
          value: get(game, issue.path),
        });
      });
    }
  });

  return (
    <section>
      <h1 className="text-3xl font-bold">Data Quality Diagnostics</h1>
      <div className="grid gap-4 md:grid-cols-3 my-6">
        <Card>
          <CardHeader><CardTitle>Total Records</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{rawGames.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Valid Records</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-500">{validCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Records with Issues</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-500">{rawGames.length - validCount}</p></CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Issue Details</h2>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Game ID/Name</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              // Use the stable composite key.
              <TableRow key={issue.id}>
                <TableCell>
                  {/* Ensure the link is only active if a valid game id exists. */}
                  {typeof issue.id === 'string' && issue.id.startsWith('Row') ? (
                    `${issue.name} (${issue.id})`
                  ) : (
                    <Link href={`/game/${issue.id}`} className="text-sky-500 hover:underline">
                      {issue.name} ({issue.id})
                    </Link>
                  )}
                </TableCell>
                <TableCell><code>{issue.field}</code></TableCell>
                <TableCell>{issue.issue}</TableCell>
                <TableCell><code className="text-red-500">{JSON.stringify(issue.value)}</code></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
