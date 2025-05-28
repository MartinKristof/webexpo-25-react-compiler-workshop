import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { TestResult } from '@/lib/types';

interface StatisticalAnalysisProps {
  selectedResults: TestResult[];
  selectedComponentId: string | null;
  formatTime: (time: number) => string;
}

const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({
  selectedResults,
  selectedComponentId,
  formatTime,
}) => {
  if (!selectedResults.length || !selectedComponentId) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Statistical Analysis</CardTitle>
        <CardDescription>Detailed performance statistics for {selectedComponentId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border p-2 text-left">Test</th>
                <th className="border p-2 text-left">Metric</th>
                <th className="border p-2 text-left">Min (ms)</th>
                <th className="border p-2 text-left">Max (ms)</th>
                <th className="border p-2 text-left">Mean (ms)</th>
                <th className="border p-2 text-left">Median (ms)</th>
                <th className="border p-2 text-left">75th Percentile (ms)</th>
                <th className="border p-2 text-left">95th Percentile (ms)</th>
                <th className="border p-2 text-left">99th Percentile (ms)</th>
              </tr>
            </thead>
            <tbody>
              {selectedResults
                .flatMap((result, resultIndex) => {
                  const summary = result.summaries.find(s => s.componentId === selectedComponentId);
                  if (!summary) return null;

                  const testName = `${result.testDescription} (${result.testType}${result.scenario ? ` - ${result.scenario}` : ''})`;

                  return [
                    // Actual Duration row
                    <tr
                      key={`${resultIndex}-actual`}
                      className={resultIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                    >
                      <td className="border p-2 font-medium" rowSpan={4}>
                        {testName}
                      </td>
                      <td className="border p-2 font-medium">Actual Duration</td>
                      <td className="border p-2">{formatTime(summary.statistics.actualDuration.min)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.actualDuration.max)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.actualDuration.mean)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.actualDuration.median)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.actualDuration.p75)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.actualDuration.p95)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.actualDuration.p99)}</td>
                    </tr>,
                    // Base Duration row
                    <tr
                      key={`${resultIndex}-base`}
                      className={resultIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                    >
                      <td className="border p-2 font-medium">Base Duration</td>
                      <td className="border p-2">{formatTime(summary.statistics.baseDuration.min)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.baseDuration.max)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.baseDuration.mean)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.baseDuration.median)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.baseDuration.p75)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.baseDuration.p95)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.baseDuration.p99)}</td>
                    </tr>,
                    // Commit Time row
                    <tr
                      key={`${resultIndex}-commit`}
                      className={resultIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                    >
                      <td className="border p-2 font-medium">Commit Time</td>
                      <td className="border p-2">{formatTime(summary.statistics.commitTime.min)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.commitTime.max)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.commitTime.mean)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.commitTime.median)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.commitTime.p75)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.commitTime.p95)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.commitTime.p99)}</td>
                    </tr>,
                    // Start Time row
                    <tr
                      key={`${resultIndex}-start`}
                      className={resultIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                    >
                      <td className="border p-2 font-medium">Start Time</td>
                      <td className="border p-2">{formatTime(summary.statistics.startTime.min)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.startTime.max)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.startTime.mean)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.startTime.median)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.startTime.p75)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.startTime.p95)}</td>
                      <td className="border p-2">{formatTime(summary.statistics.startTime.p99)}</td>
                    </tr>,
                  ];
                })
                .filter(Boolean)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticalAnalysis;
