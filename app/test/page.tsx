'use client';
import { PerformanceTester, TestConfig, CustomTestScenario, TestSimulator } from '@webexpo/performance-tester';
import { useState } from 'react';

// Configure your test
const config: TestConfig = {
  testName: 'Auto-Memoized Component Test',
  testType: 'interaction',
  testCount: 10,
  scenario: 'increment',
};

export default function App() {
  const [count, setCount] = useState(0);

  // Update simulator to use the count state and handle interactions
  const simulatorWithState: TestSimulator = {
    setCurrentTest: (testId: number) => {
      setCount(testId);
    },
    performInteraction: async (scenario: string | CustomTestScenario) => {
      if (typeof scenario === 'string') {
        if (scenario === 'increment') {
          // Find and click the increment button
          const button = document.querySelector<HTMLButtonElement>('[data-testid="increment-button"]');
          if (!button) {
            throw new Error('Increment button not found');
          }
          button.click();
          // Wait a bit to ensure the click is processed
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } else if (typeof scenario === 'object') {
        // Handle any custom scenarios
        await scenario.run(simulatorWithState);
      }
    },
  };

  return (
    <PerformanceTester
      config={config}
      simulator={simulatorWithState}
      onTestComplete={state => {
        console.log('Test completed:', state.summary);
      }}
      onTestProgress={(current, total) => {
        console.log(`Test ${current} of ${total}`);
      }}
      autoStart={false}
      componentId="Counter"
    >
      <Counter count={count} setCount={setCount} />
    </PerformanceTester>
  );
}

interface CounterProps {
  count: number;
  setCount: (value: number | ((prev: number) => number)) => void;
}

function Counter({ count, setCount }: CounterProps) {
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)} data-testid="increment-button">
        Increment
      </button>
    </div>
  );
}
