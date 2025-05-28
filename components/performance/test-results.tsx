import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileDown } from 'lucide-react';
import type { TestScenario, TestState, TestType } from '@/lib/performance/types';
import { saveResultsAsJSON, saveResultsAsCSV } from '@/lib/performance/export';

interface TestResultsProps {
  state: TestState;
  testName: string;
  testType: TestType;
  scenario?: TestScenario;
}

export function TestResults({ state, testName, testType, scenario }: TestResultsProps) {
  const { results, summary, componentSummaries } = state;

  if (results.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Results</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-60 text-sm">{summary}</pre>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <Button
          onClick={() => saveResultsAsJSON(results, componentSummaries, testName, testType, scenario)}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          Save as JSON
        </Button>
        <Button onClick={() => saveResultsAsCSV(componentSummaries, testName, testType, scenario)} className="w-full">
          <FileDown className="mr-2 h-4 w-4" />
          Save as CSV
        </Button>
        <Button onClick={() => (window.location.href = '/compare')} variant="outline" className="w-full">
          View Comparison
        </Button>
      </CardFooter>
    </Card>
  );
}
