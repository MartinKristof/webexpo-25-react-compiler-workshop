import type { TestConfig, TestResult, TestState, TestSimulator, ProfilerData } from './types';
import { calculateStatistics, sortComponentIds } from './statistics';

export class TestRunner {
  private simulator: TestSimulator;
  private config: TestConfig;
  private onTestComplete: (state: TestState) => void;
  private onTestProgress: (current: number, total: number) => void;
  private isRunning: boolean = false;
  private currentTest: number = 0;
  private metrics: TestResult[] = [];
  private testInterval: ReturnType<typeof setTimeout> | null = null;

  constructor(
    simulator: TestSimulator,
    config: TestConfig,
    onTestComplete: (state: TestState) => void,
    onTestProgress: (current: number, total: number) => void,
  ) {
    this.simulator = simulator;
    this.config = config;
    this.onTestComplete = onTestComplete;
    this.onTestProgress = onTestProgress;
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
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }

    this.isRunning = false;

    if (this.currentTest === this.config.testCount) {
      this.processResults();
    }

    this.metrics = [];
    this.currentTest = 0;
  }

  private startUpdateTest(): void {
    this.currentTest = 1;
    this.simulator.setCurrentTest(this.currentTest);
    this.onTestProgress(this.currentTest, this.config.testCount);

    if (this.config.testCount > 1) {
      this.testInterval = setInterval(() => {
        if (this.currentTest < this.config.testCount) {
          const nextTest = this.currentTest + 1;
          this.currentTest = nextTest;
          this.simulator.setCurrentTest(this.currentTest);
          this.onTestProgress(this.currentTest, this.config.testCount);
        } else {
          setTimeout(() => this.stopTest(), 100);
        }
      }, 500);
    } else {
      setTimeout(() => this.stopTest(), 100);
    }
  }

  private startMountTest(): void {
    this.currentTest = 1;
    this.simulator.setCurrentTest(this.currentTest);
    this.onTestProgress(this.currentTest, this.config.testCount);

    if (this.config.testCount > 1) {
      this.testInterval = setInterval(() => {
        if (this.currentTest < this.config.testCount) {
          const nextTest = this.currentTest + 1;
          this.currentTest = nextTest;
          this.simulator.setCurrentTest(this.currentTest);
          this.onTestProgress(this.currentTest, this.config.testCount);
        } else {
          setTimeout(() => this.stopTest(), 100);
        }
      }, 500);
    } else {
      setTimeout(() => this.stopTest(), 100);
    }
  }

  private startInteractionTest(): void {
    const scenario = this.config.customScenario || this.config.scenario;
    if (!scenario) {
      throw new Error('No scenario provided for interaction test');
    }

    this.currentTest = 1;
    this.simulator.setCurrentTest(this.currentTest);
    this.simulator.performInteraction(scenario);
    this.onTestProgress(this.currentTest, this.config.testCount);

    if (this.config.testCount > 1) {
      this.testInterval = setInterval(() => {
        if (this.currentTest < this.config.testCount) {
          const nextTest = this.currentTest + 1;
          this.currentTest = nextTest;
          this.simulator.setCurrentTest(this.currentTest);
          this.onTestProgress(this.currentTest, this.config.testCount);
          this.simulator.performInteraction(scenario);
        } else {
          setTimeout(() => this.stopTest(), 100);
        }
      }, 500);
    } else {
      setTimeout(() => this.stopTest(), 100);
    }
  }

  private processResults(): void {
    const componentMetrics: Record<string, TestResult['metrics']> = {};

    this.metrics.forEach(result => {
      result.metrics.forEach(metric => {
        if (!componentMetrics[metric.id]) {
          componentMetrics[metric.id] = [];
        }
        componentMetrics[metric.id].push(metric);
      });
    });

    const sortedComponentIds = sortComponentIds(Object.keys(componentMetrics));

    const componentSummaries = sortedComponentIds.map(componentId => {
      const metrics = componentMetrics[componentId];

      const actualDurations = metrics.map(m => m.actualDuration);
      const baseDurations = metrics.map(m => m.baseDuration);
      const commitTimes = metrics.map(m => m.commitTime);
      const startTimes = metrics.map(m => m.startTime);

      const phaseCounts = metrics.reduce(
        (acc, metric) => {
          acc[metric.phase] = (acc[metric.phase] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        componentId,
        measurements: metrics.length,
        statistics: {
          actualDuration: calculateStatistics(actualDurations),
          baseDuration: calculateStatistics(baseDurations),
          commitTime: calculateStatistics(commitTimes),
          startTime: calculateStatistics(startTimes),
          phase: {
            mount: phaseCounts['mount'] || 0,
            update: phaseCounts['update'] || 0,
            nested_update: phaseCounts['nested_update'] || 0,
          },
        },
        rawMetrics: metrics,
      };
    });

    const summary = this.generateSummaryText(componentSummaries);
    const state: TestState = {
      isRunning: false,
      currentTest: this.currentTest,
      totalTests: this.config.testCount,
      results: this.metrics,
      summary,
      componentSummaries,
    };

    this.onTestComplete(state);
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

  public addMetrics(metrics: ProfilerData[]): void {
    if (!this.isRunning) return;

    this.metrics.push({
      testId: this.currentTest,
      metrics,
    });
  }

  public updateConfig(newConfig: TestConfig): void {
    if (this.isRunning) {
      throw new Error('Cannot update config while test is running');
    }
    this.config = newConfig;
  }
}
