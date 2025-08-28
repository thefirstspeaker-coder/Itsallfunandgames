// app/data/quality/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DataQualityHoldingPage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Under Construction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-gray-600">
              We're currently working on our Data Quality Diagnostics page. 
              Please check back soon for an in-depth analysis of our game data.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
