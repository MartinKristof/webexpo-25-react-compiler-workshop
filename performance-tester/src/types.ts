export interface ProfilerData {
  id: string;
  phase: string;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

export interface TestResult {
  testId: number;
  metrics: ProfilerData[];
}

export interface ComponentSummary {
  componentId: string;
  measurements: number;
  statistics: {
    actualDuration: Statistics;
    baseDuration: Statistics;
    commitTime: Statistics;
    startTime: Statistics;
    phase: {
      mount: number;
      update: number;
      nested_update: number;
    };
  };
  rawMetrics: ProfilerData[];
}

export interface Statistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  p75: number;
  p95: number;
  p99: number;
  mode: number;
}

export type TestPhase = 'mount' | 'update' | 'nested_update';

export interface TestConfig {
  testName: string;
  testType: 'update' | 'mount' | 'interaction';
  testCount: number;
  scenario?: string;
  customScenario?: CustomTestScenario;
}

export interface TestState {
  isRunning: boolean;
  currentTest: number;
  totalTests: number;
  results: TestResult[];
  summary: string;
  componentSummaries: ComponentSummary[];
}

export interface TestSummary {
  totalTests: number;
  componentSummaries: ComponentSummary[];
}

export interface TestResultData {
  testDescription: string;
  testType: 'update' | 'mount' | 'interaction';
  summary: TestSummary;
  results: TestResult[];
}

export interface CustomTestScenario {
  name: string;
  run: (simulator: TestSimulator) => Promise<void>;
}

export interface TestSimulator {
  setCurrentTest: (testId: number) => void;
  performInteraction: (scenario: string | CustomTestScenario) => Promise<void>;
}

export interface PerformanceTestOptions {
  onTestComplete?: (state: TestState) => void;
  onTestProgress?: (current: number, total: number) => void;
  onToggleAppVisibility?: () => void;
  storageKey?: string;
}
