import type { TestConfig, TestResult, TestState } from '../performance/types';
import { TodoSimulator } from './todo-simulator';
import { calculateStatistics, sortComponentIds } from '../performance/statistics';
import LZString from 'lz-string';

export class TestRunner {
  private simulator: TodoSimulator;
  private config: TestConfig;
  private onTestComplete: (state: TestState) => void;
  private onTestProgress: (current: number, total: number) => void;
  private isRunning: boolean = false;
  private currentTest: number = 0;
  private metrics: TestResult[] = [];
  private testInterval: ReturnType<typeof setTimeout> | null = null;
  private onToggleAppVisibility?: () => void;

  constructor(
    simulator: TodoSimulator,
    config: TestConfig,
    onTestComplete: (state: TestState) => void,
    onTestProgress: (current: number, total: number) => void,
    onToggleAppVisibility?: () => void,
  ) {
    this.simulator = simulator;
    this.config = config;
    this.onTestComplete = onTestComplete;
    this.onTestProgress = onTestProgress;
    this.onToggleAppVisibility = onToggleAppVisibility;
  }

  public startTest(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentTest = 0;
    this.metrics = [];

    switch (this.config.testType) {
      case 'update':
        this.startUpdateTest();
        break;
      case 'mount':
        this.startMountTest();
        break;
      case 'interaction':
        this.startInteractionTest();
        break;
    }
  }

  public stopTest(): void {
    // Clear the interval first to prevent any more tests from running
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }

    // Set isRunning to false
    this.isRunning = false;

    // Only process results if we completed all tests
    if (this.currentTest === this.config.testCount) {
      this.processResults();
    }

    // Clear metrics and reset state
    this.metrics = [];
    this.currentTest = 0;
  }

  private startUpdateTest(): void {
    // Schedule the first test
    setTimeout(() => {
      this.currentTest = 1;
      this.simulator.setCurrentTest(this.currentTest);
      this.simulator.simulateAddTodo();
      this.onTestProgress(this.currentTest, this.config.testCount);

      // Only schedule remaining tests if we need more than one test
      if (this.config.testCount > 1) {
        // Schedule remaining tests
        this.testInterval = setInterval(() => {
          if (this.currentTest < this.config.testCount) {
            const nextTest = this.currentTest + 1;

            this.currentTest = nextTest;
            this.simulator.setCurrentTest(this.currentTest);
            this.onTestProgress(this.currentTest, this.config.testCount);
            this.simulator.simulateAddTodo();
          } else {
            // Wait a bit to collect metrics before stopping
            setTimeout(() => {
              this.stopTest();
            }, 100);
          }
        }, 100);
      } else {
        // For single test, wait a bit to collect metrics before stopping
        setTimeout(() => {
          this.stopTest();
        }, 100);
      }
    }, 100);
  }

  private startMountTest(): void {
    if (!this.onToggleAppVisibility) {
      // eslint-disable-next-line no-console
      console.error('Toggle app visibility callback not set for mount test');
      return;
    }

    // Schedule the first mount test after a short delay
    setTimeout(() => {
      // Run the first test
      this.currentTest = 1;
      this.onTestProgress(this.currentTest, this.config.testCount);

      // Toggle app visibility to trigger mount
      this.onToggleAppVisibility!();

      // If we only want one test, stop here
      if (this.config.testCount === 1) {
        this.stopTest();
        return;
      }

      // For multiple tests, schedule the remaining ones
      let remainingTests = this.config.testCount - 1; // We already ran one test

      // Clear any existing interval
      if (this.testInterval) {
        clearInterval(this.testInterval);
        this.testInterval = null;
      }

      this.testInterval = setInterval(() => {
        if (remainingTests > 0) {
          // Toggle app visibility to trigger unmount
          this.onToggleAppVisibility!();

          // Schedule the mount after a short delay
          setTimeout(() => {
            this.currentTest = this.config.testCount - remainingTests + 1;
            this.onTestProgress(this.currentTest, this.config.testCount);

            // Toggle app visibility to trigger mount
            this.onToggleAppVisibility!();

            remainingTests--;

            // If this was the last test, stop immediately
            if (remainingTests === 0) {
              this.stopTest();
            }
          }, 100);
        } else {
          this.stopTest();
        }
      }, 1000);
    }, 100);
  }

  private startInteractionTest(): void {
    // For toggle and delete tests, ensure we have enough todos
    const scenario = this.config.customScenario || this.config.scenario;
    if (typeof scenario === 'string' && (scenario === 'toggleTodo' || scenario === 'deleteTodo')) {
      // Get current number of todos
      const currentTodos = this.simulator.getTodoCount();

      // Only add todos if we don't have enough
      if (currentTodos < this.config.testCount) {
        const todosToAdd = this.config.testCount - currentTodos;

        // Add missing todos
        for (let i = 0; i < todosToAdd; i++) {
          setTimeout(() => {
            this.simulator.simulateAddTodo();
          }, i * 200);
        }

        // Start the actual test after adding todos
        setTimeout(
          () => {
            this.runInteractionTest();
          },
          todosToAdd * 200 + 100,
        ); // Wait for todos to be added plus a small buffer
      } else {
        // We already have enough todos, start the test immediately
        this.runInteractionTest();
      }
    } else {
      // Start the test immediately for other scenarios
      this.runInteractionTest();
    }
  }

  private runInteractionTest(): void {
    const scenario = this.config.customScenario || this.config.scenario;
    if (!scenario) {
      throw new Error('No scenario provided for interaction test');
    }
    this.currentTest = 1;
    this.simulator.setCurrentTest(this.currentTest);

    // Perform the selected interaction
    this.simulator.performInteraction(scenario);
    this.onTestProgress(this.currentTest, this.config.testCount);

    // Only schedule remaining tests if we need more than one test
    if (this.config.testCount > 1) {
      // Schedule remaining tests
      this.testInterval = setInterval(() => {
        if (this.currentTest < this.config.testCount) {
          const nextTest = this.currentTest + 1;

          this.currentTest = nextTest;
          this.simulator.setCurrentTest(this.currentTest);
          this.onTestProgress(this.currentTest, this.config.testCount);
          this.simulator.performInteraction(scenario);
        } else {
          // Wait a bit to collect metrics before stopping
          setTimeout(() => {
            this.stopTest();
          }, 100);
        }
      }, 500);
    } else {
      // For single test, wait a bit to collect metrics before stopping
      setTimeout(() => {
        this.stopTest();
      }, 100);
    }
  }

  private processResults(): void {
    // Group metrics by component ID
    const componentMetrics: Record<string, TestResult['metrics']> = {};

    this.metrics.forEach(result => {
      result.metrics.forEach(metric => {
        if (!componentMetrics[metric.id]) {
          componentMetrics[metric.id] = [];
        }
        componentMetrics[metric.id].push(metric);
      });
    });

    // Sort component IDs in the desired order
    const sortedComponentIds = sortComponentIds(Object.keys(componentMetrics));

    // Calculate statistics for each component
    const componentSummaries = sortedComponentIds.map(componentId => {
      const metrics = componentMetrics[componentId];

      // Extract values for statistical calculations
      const actualDurations = metrics.map(m => m.actualDuration);
      const baseDurations = metrics.map(m => m.baseDuration);
      const commitTimes = metrics.map(m => m.commitTime);
      const startTimes = metrics.map(m => m.startTime);

      // Calculate phase statistics
      const phaseCounts = metrics.reduce(
        (acc, metric) => {
          acc[metric.phase] = (acc[metric.phase] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Calculate statistics
      const actualDurationStats = calculateStatistics(actualDurations);
      const baseDurationStats = calculateStatistics(baseDurations);
      const commitTimeStats = calculateStatistics(commitTimes);
      const startTimeStats = calculateStatistics(startTimes);

      return {
        componentId,
        measurements: metrics.length,
        statistics: {
          actualDuration: actualDurationStats,
          baseDuration: baseDurationStats,
          commitTime: commitTimeStats,
          startTime: startTimeStats,
          phase: {
            mount: phaseCounts['mount'] || 0,
            update: phaseCounts['update'] || 0,
            nested_update: phaseCounts['nested_update'] || 0,
          },
        },
        rawMetrics: metrics,
      };
    });

    // Generate summary text
    const summaryText = this.generateSummaryText(componentSummaries);

    // Save the test results to localStorage
    this.saveToLocalStorage(componentSummaries);

    // Notify completion
    this.onTestComplete({
      isRunning: false,
      currentTest: this.currentTest,
      totalTests: this.config.testCount,
      results: this.metrics,
      summary: summaryText,
      componentSummaries,
    });
  }

  private generateSummaryText(componentSummaries: TestState['componentSummaries']): string {
    let summaryText = `Test Summary (${this.config.testName})\n`;
    summaryText += `Test Type: ${this.config.testType}${
      this.config.testType === 'interaction'
        ? ` (${this.config.customScenario ? this.config.customScenario.name : this.config.scenario})`
        : ''
    }\n`;
    summaryText += `Total Metrics: ${this.metrics.length}\n\n`;

    summaryText += 'Component Metrics:\n';
    componentSummaries.forEach(summary => {
      summaryText += `\n${summary.componentId}:\n`;
      summaryText += `  Measurements: ${summary.measurements}\n`;
      summaryText += `  Phases:\n`;
      summaryText += `    Mount: ${summary.statistics.phase.mount}\n`;
      summaryText += `    Update: ${summary.statistics.phase.update}\n`;
      summaryText += `    Nested Update: ${summary.statistics.phase.nested_update}\n`;

      summaryText += `  Actual Duration:\n`;
      summaryText += `    Min: ${summary.statistics.actualDuration.min.toFixed(3)} ms\n`;
      summaryText += `    Max: ${summary.statistics.actualDuration.max.toFixed(3)} ms\n`;
      summaryText += `    Mean: ${summary.statistics.actualDuration.mean.toFixed(3)} ms\n`;
      summaryText += `    Median: ${summary.statistics.actualDuration.median.toFixed(3)} ms\n`;
      summaryText += `    75th Percentile: ${summary.statistics.actualDuration.p75.toFixed(3)} ms\n`;
      summaryText += `    95th Percentile: ${summary.statistics.actualDuration.p95.toFixed(3)} ms\n`;
      summaryText += `    99th Percentile: ${summary.statistics.actualDuration.p99.toFixed(3)} ms\n`;

      summaryText += `  Base Duration:\n`;
      summaryText += `    Min: ${summary.statistics.baseDuration.min.toFixed(3)} ms\n`;
      summaryText += `    Max: ${summary.statistics.baseDuration.max.toFixed(3)} ms\n`;
      summaryText += `    Mean: ${summary.statistics.baseDuration.mean.toFixed(3)} ms\n`;
      summaryText += `    Median: ${summary.statistics.baseDuration.median.toFixed(3)} ms\n`;
      summaryText += `    75th Percentile: ${summary.statistics.baseDuration.p75.toFixed(3)} ms\n`;
      summaryText += `    95th Percentile: ${summary.statistics.baseDuration.p95.toFixed(3)} ms\n`;
      summaryText += `    99th Percentile: ${summary.statistics.baseDuration.p99.toFixed(3)} ms\n`;

      summaryText += `  Start Time:\n`;
      summaryText += `    Min: ${summary.statistics.startTime.min.toFixed(3)} ms\n`;
      summaryText += `    Max: ${summary.statistics.startTime.max.toFixed(3)} ms\n`;
      summaryText += `    Mean: ${summary.statistics.startTime.mean.toFixed(3)} ms\n`;
      summaryText += `    Median: ${summary.statistics.startTime.median.toFixed(3)} ms\n`;
      summaryText += `    75th Percentile: ${summary.statistics.startTime.p75.toFixed(3)} ms\n`;
      summaryText += `    95th Percentile: ${summary.statistics.startTime.p95.toFixed(3)} ms\n`;
      summaryText += `    99th Percentile: ${summary.statistics.startTime.p99.toFixed(3)} ms\n`;

      summaryText += `  Commit Time:\n`;
      summaryText += `    Min: ${summary.statistics.commitTime.min.toFixed(3)} ms\n`;
      summaryText += `    Max: ${summary.statistics.commitTime.max.toFixed(3)} ms\n`;
      summaryText += `    Mean: ${summary.statistics.commitTime.mean.toFixed(3)} ms\n`;
      summaryText += `    Median: ${summary.statistics.commitTime.median.toFixed(3)} ms\n`;
      summaryText += `    75th Percentile: ${summary.statistics.commitTime.p75.toFixed(3)} ms\n`;
      summaryText += `    95th Percentile: ${summary.statistics.commitTime.p95.toFixed(3)} ms\n`;
      summaryText += `    99th Percentile: ${summary.statistics.commitTime.p99.toFixed(3)} ms\n`;
    });

    return summaryText;
  }

  private saveToLocalStorage(componentSummaries: TestState['componentSummaries']): void {
    const testResultData = {
      timestamp: new Date().toISOString(),
      testDescription: this.config.testName,
      testType: this.config.testType,
      scenario: this.config.customScenario ? this.config.customScenario.name : this.config.scenario,
      summaries: componentSummaries,
      rawResults: this.metrics,
    };

    // Get existing results from localStorage
    const existingResultsStr = localStorage.getItem('performanceTestResults');
    let allResults: (typeof testResultData)[] = [];

    if (existingResultsStr) {
      try {
        // Decompress and parse existing results
        const decompressed = LZString.decompressFromUTF16(existingResultsStr);
        if (decompressed) {
          allResults = JSON.parse(decompressed);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to decompress existing results:', error);
      }
    }

    // Add new results
    allResults.push(testResultData);

    try {
      // Compress and save back to localStorage
      const compressed = LZString.compressToUTF16(JSON.stringify(allResults));
      localStorage.setItem('performanceTestResults', compressed);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save test results to localStorage:', error);
    }
  }

  public addMetric(metric: Omit<TestResult['metrics'][0], 'phase'> & { phase: string }): void {
    if (!this.isRunning) return;

    // Find or create the test result for the current test
    let testResult = this.metrics.find(r => r.testId === this.currentTest);

    if (!testResult) {
      testResult = { testId: this.currentTest, metrics: [] };
      this.metrics.push(testResult);
    }

    // Only add metrics for the current test
    if (testResult.testId === this.currentTest) {
      // Add the new metric
      testResult.metrics.push(metric as TestResult['metrics'][0]);
    }
  }

  public updateConfig(config: TestConfig): void {
    this.config = config;
  }

  public setToggleAppVisibility(callback: () => void) {
    this.onToggleAppVisibility = callback;
  }
}
