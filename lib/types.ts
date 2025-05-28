export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export interface StatisticsData {
  min: number;
  max: number;
  mean: number;
  median: number;
  p75: number;
  p95: number;
  p99: number;
  mode: number;
}

export interface ComponentStatistics {
  actualDuration: StatisticsData;
  baseDuration: StatisticsData;
  commitTime: StatisticsData;
  startTime: StatisticsData;
  phase: {
    mount: number;
    update: number;
    nested_update: number;
  };
}

export interface ProfilerMetric {
  actualDuration: number;
  baseDuration: number;
  commitTime: number;
  startTime: number;
}

export interface ComponentSummary {
  componentId: string;
  measurements: number;
  statistics: ComponentStatistics;
  rawMetrics?: ProfilerMetric[];
}

export interface TestResult {
  timestamp: string;
  testDescription: string;
  testType: string;
  scenario?: string;
  summaries: ComponentSummary[];
}

export interface FlameGraphNode {
  id: string;
  value: number;
  children?: FlameGraphNode[];
  color?: string;
  tooltip?: string;
}

export interface ChartDataPoint {
  name: string;
  actualDuration: number;
  baseDuration: number;
  commitTime: number;
  startTime: number;
  timestamp: string;
  min: number;
  max: number;
  median: number;
  p75: number;
  mean: number;
  p95: number;
  p99: number;
  mode: number;
  testId: string;
}

export interface TimelineDataPoint {
  name: string;
  actualDuration: number;
  baseDuration: number;
  commitTime: number;
  startTime: number;
  index: number;
  testId: string;
  iterationId?: string;
}

export interface ComparisonDataPoint {
  name: string;
  actualDurationDiff: number;
  baseDurationDiff: number;
  commitTimeDiff: number;
  startTimeDiff: number;
  actualDuration: number;
  baseDuration: number;
  commitTime: number;
  startTime: number;
  baselineActualDuration: number;
  baselineBaseDuration: number;
  baselineCommitTime: number;
  baselineStartTime: number;
  testId: string;
}

export interface ComponentComparison {
  componentId: string;
  autoDuration: number;
  manualDuration: number;
  unoptimizedDuration: number;
  autoImprovement: number;
  manualImprovement: number;
  bestImplementation: 'auto' | 'manual' | 'unmemoized';
}
