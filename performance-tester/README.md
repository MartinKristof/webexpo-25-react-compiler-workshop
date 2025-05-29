# @webexpo/performance-tester

A React performance testing library for measuring component render times and interactions. This library provides tools to measure and analyze the performance of React components using the React Profiler API.

## Installation

```bash
npm install @webexpo/performance-tester
# or
yarn add @webexpo/performance-tester
```

## Features

- Measure component render times (mount, update, nested updates)
- Track component interactions and their performance impact
- Collect detailed statistics (min, max, mean, median, percentiles)
- Save test results to localStorage for later analysis
- Support for custom test scenarios
- TypeScript support
- Easy-to-use React component wrapper

## Usage

### Using the PerformanceTester Component

The easiest way to measure component performance is to use the `PerformanceTester` component:

```tsx
import { PerformanceTester, TestConfig } from '@webexpo/performance-tester';

// Create a test simulator that implements the TestSimulator interface
const simulator = {
  setCurrentTest: (testId: number) => {
    // Update your component state or props based on testId
    setCount(testId);
  },
  performInteraction: async (scenario: string) => {
    // Perform the interaction based on the scenario
    if (scenario === 'increment') {
      setCount(c => c + 1);
    }
  },
};

// Configure your test
const config: TestConfig = {
  testName: 'Counter Component Test',
  testType: 'update',
  testCount: 10,
};

function App() {
  return (
    <PerformanceTester
      config={config}
      simulator={simulator}
      onTestComplete={state => {
        console.log('Test completed:', state.summary);
      }}
      onTestProgress={(current, total) => {
        console.log(`Test ${current} of ${total}`);
      }}
      autoStart={false}
      componentId="Counter"
    >
      <Counter />
    </PerformanceTester>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

The `PerformanceTester` component provides:

- A wrapper around your component with built-in Profiler integration
- Start/Stop test buttons
- Automatic metrics collection
- Normalized timing measurements
- Progress and completion callbacks

### Props

```typescript
interface PerformanceTesterProps {
  children: React.ReactNode; // The component to measure
  config: TestConfig; // Test configuration
  simulator: TestSimulator; // Test simulator implementation
  onTestComplete?: (state: TestState) => void; // Called when test completes
  onTestProgress?: (current: number, total: number) => void; // Called during test progress
  autoStart?: boolean; // Whether to start test automatically
  componentId?: string; // ID for the Profiler component
}
```

### Basic Usage (Manual Profiler Integration)

If you prefer to integrate the Profiler manually, you can use the `TestRunner` class directly:

```tsx
import { TestRunner, TestConfig } from '@webexpo/performance-tester';

// Create a test simulator that implements the TestSimulator interface
const simulator = {
  setCurrentTest: (testId: number) => {
    // Update your component state or props based on testId
  },
  performInteraction: async (scenario: string) => {
    // Perform the interaction based on the scenario
  },
};

// Configure your test
const config: TestConfig = {
  testName: 'MyComponent Test',
  testType: 'update', // or 'mount' or 'interaction'
  testCount: 10,
  scenario: 'toggle-item', // for interaction tests
};

// Create the test runner
const runner = new TestRunner(
  simulator,
  config,
  state => {
    // Handle test completion
    console.log(state.summary);
  },
  (current, total) => {
    // Handle test progress
    console.log(`Test ${current} of ${total}`);
  },
);

// Start the test
runner.startTest();

// Add metrics from React Profiler
const onRender = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  runner.addMetrics([
    {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    },
  ]);
};
```

### Using with React Profiler

```tsx
import React, { Profiler } from 'react';
import { TestRunner } from '@webexpo/performance-tester';

function MyComponent() {
  const [runner] = React.useState(() => new TestRunner(/* ... */));

  const onRender = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    runner.addMetrics([
      {
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      },
    ]);
  };

  return (
    <Profiler id="MyComponent" onRender={onRender}>
      {/* Your component content */}
    </Profiler>
  );
}
```

### Custom Test Scenarios

```tsx
import { TestRunner, CustomTestScenario } from '@webexpo/performance-tester';

const customScenario: CustomTestScenario = {
  id: 'complex-interaction',
  name: 'Complex User Interaction',
  description: 'Simulates a complex user interaction sequence',
  run: async simulator => {
    // Implement your custom test scenario
    await simulator.performInteraction('step1');
    await new Promise(resolve => setTimeout(resolve, 100));
    await simulator.performInteraction('step2');
  },
};

const config: TestConfig = {
  testName: 'Complex Interaction Test',
  testType: 'interaction',
  testCount: 5,
  customScenario,
};
```

## API Reference

### PerformanceTester

A React component that wraps your component with performance testing capabilities.

#### Props

```typescript
interface PerformanceTesterProps {
  children: React.ReactNode;
  config: TestConfig;
  simulator: TestSimulator;
  onTestComplete?: (state: TestState) => void;
  onTestProgress?: (current: number, total: number) => void;
  autoStart?: boolean;
  componentId?: string;
}
```

### TestRunner

The main class for running performance tests.

#### Constructor

```typescript
new TestRunner(
  simulator: TestSimulator,
  config: TestConfig,
  onTestComplete: (state: TestState) => void,
  onTestProgress: (current: number, total: number) => void,
  options?: {
    storageKey?: string;
  }
)
```

#### Methods

- `startTest(): void` - Start the performance test
- `stopTest(): void` - Stop the current test
- `addMetrics(metrics: ProfilerData[]): void` - Add metrics from React Profiler

### Types

- `TestConfig` - Configuration for a test run
- `TestState` - Current state of the test
- `TestResult` - Results of a single test iteration
- `ComponentSummary` - Summary of component performance
- `Statistics` - Statistical measurements
- `ProfilerData` - Raw profiler data
- `TestSimulator` - Interface for test simulators
- `CustomTestScenario` - Interface for custom test scenarios

## License

MIT
