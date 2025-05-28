import type { ComponentSummary, TestResult, TestType, TestScenario } from './types';

export const convertToCSV = (
  componentSummaries: ComponentSummary[],
  testName: string,
  testType: TestType,
  scenario?: TestScenario,
): string => {
  // Create header row
  let csv =
    'Test Name,Test Type,Scenario,Component ID,Measurements,Avg Actual Duration (ms),Avg Base Duration (ms),Avg Commit Time (ms),Median Actual Duration (ms),P75 Actual Duration (ms),P95 Actual Duration (ms),P99 Actual Duration (ms),Start Time\n';

  // Add data rows
  componentSummaries.forEach(summary => {
    csv += `"${testName}","${testType}","${scenario || ''}","${summary.componentId}",${summary.measurements},${summary.statistics.actualDuration.mean.toFixed(3)},${summary.statistics.baseDuration.mean.toFixed(3)},${summary.statistics.commitTime.mean.toFixed(3)},${summary.statistics.actualDuration.median.toFixed(3)},${summary.statistics.actualDuration.p75.toFixed(3)},${summary.statistics.actualDuration.p95.toFixed(3)},${summary.statistics.actualDuration.p99.toFixed(3)},${new Date(summary.statistics.startTime.mean).toISOString()}\n`;
  });

  return csv;
};

export const saveAsFile = (content: string, filename: string, type: string): void => {
  // Create a blob with the data
  const blob = new Blob([content], { type });

  // Create a URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  // Append to the document, click it, and remove it
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

export const saveResultsAsJSON = (
  results: TestResult[],
  componentSummaries: ComponentSummary[],
  testName: string,
  testType: TestType,
  scenario?: TestScenario,
): void => {
  if (results.length === 0) return;

  const resultsWithSummary = {
    testDescription: testName,
    testType,
    scenario,
    summary: {
      totalTests: results.length,
      componentSummaries,
    },
    results,
  };

  const filename = `react-compiler-${testType}-${
    testType === 'interaction' ? scenario + '-' : ''
  }test-${new Date().toISOString().replace(/:/g, '-')}.json`;

  saveAsFile(JSON.stringify(resultsWithSummary, null, 2), filename, 'application/json');
};

export const saveResultsAsCSV = (
  componentSummaries: ComponentSummary[],
  testName: string,
  testType: TestType,
  scenario?: TestScenario,
): void => {
  if (componentSummaries.length === 0) return;

  const csv = convertToCSV(componentSummaries, testName, testType, scenario);
  const filename = `react-compiler-${testType}-${
    testType === 'interaction' ? scenario + '-' : ''
  }test-${new Date().toISOString().replace(/:/g, '-')}.csv`;

  saveAsFile(csv, filename, 'text/csv;charset=utf-8;');
};
