import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function StyleGuidePage() {
  return (
    <div className="space-y-8">
      <h1>Style Guide</h1>
      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Do</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use 8px spacing increments.</li>
            <li>Keep layouts bright, clean and welcoming.</li>
            <li>Write in a friendly, trustworthy tone.</li>
            <li>Ensure text maintains AA contrast or better.</li>
          </ul>
        </CardContent>
      </Card>
      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Don’t</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2 text-red-700 dark:text-red-400">
            <li>Avoid heavy neon hues or dark, busy backgrounds.</li>
            <li>Don’t rely solely on motion; provide reduced-motion alternatives.</li>
            <li>Skip tiny touch targets or low contrast text.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
