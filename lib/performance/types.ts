import type { TodoSimulator } from '../test-simulations/todo-simulator';

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

export type TestScenario = 'toggleTodo' | 'deleteTodo' | 'editInput' | string;
export type TestType = 'update' | 'mount' | 'interaction';

export interface CustomTestScenario {
  id: string;
  name: string;
  description: string;
  run: (simulator: TodoSimulator) => Promise<void>;
}

export interface TestConfig {
  testName: string;
  testType: TestType;
  testCount: number;
  todoText?: string;
  scenario?: TestScenario;
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

export type TestPhase = 'mount' | 'update' | 'nested_update';

export interface ComparisonConfig {
  selectedTests: string[];
  selectedPhase: TestPhase;
}

export interface ComparisonResult {
  testName: string;
  phase: TestPhase;
  componentId: string;
  statistics: {
    actualDuration: Statistics;
    baseDuration: Statistics;
    commitTime: Statistics;
    startTime: Statistics;
  };
}

export interface ComparisonSummary {
  config: ComparisonConfig;
  results: ComparisonResult[];
}
