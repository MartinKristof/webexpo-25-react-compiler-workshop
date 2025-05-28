'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import type { TestConfig, TestScenario, TestState, TestType, CustomTestScenario } from '@/lib/performance/types';
import { ProfilerProvider } from '@/lib/performance/profiler';
import type { ExtendedProfilerOnRenderCallback } from '@/lib/performance/profiler';
import { TodoSimulator } from '@/lib/test-simulations/todo-simulator';
import { TestRunner } from '@/lib/test-simulations/test-runner';
import { TestControls } from '@/components/performance/test-controls';
import { TestProgress } from '@/components/performance/test-progress';
import { TestResults } from '@/components/performance/test-results';
import { StatisticsProfiler } from '@/components/performance/statistics-profiler';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { customScenarios } from '@/lib/test-simulations/scenarios';

export interface TestSettings {
  updateTestCount?: number;
  mountTestCount?: number;
  interactionTestCount?: number;
  defaultScenario?: TestScenario;
  defaultTodoText?: string;
  defaultTestType?: TestType;
  customScenarios?: CustomTestScenario[];
}

interface PerformanceTesterProps {
  children: React.ReactNode;
  testDescription?: string;
  settings?: TestSettings;
}

export default function PerformanceTester({
  children,
  testDescription = 'React Compiler Test',
  settings,
}: PerformanceTesterProps) {
  const {
    updateTestCount = 20,
    mountTestCount = 10,
    interactionTestCount = 20,
    defaultScenario = 'toggleTodo',
    defaultTodoText = 'Performance Test Todo',
    defaultTestType = 'update',
    customScenarios: additionalScenarios = [],
  } = settings || {};

  // Combine default scenarios with any additional scenarios
  const allCustomScenarios = [...customScenarios, ...additionalScenarios];

  // Add toast
  const { toast } = useToast();

  // State
  const [testName, setTestName] = useState<string>(testDescription);
  const [activeTab, setActiveTab] = useState<TestType>(defaultTestType);
  const [testState, setTestState] = useState<TestState & { scenario?: TestScenario }>({
    isRunning: false,
    currentTest: 0,
    totalTests: 0,
    results: [],
    summary: '',
    componentSummaries: [],
  });
  const [showApp, setShowApp] = useState(true);

  // Refs
  const todoInputRef = useRef<HTMLInputElement>(null);
  const addTodoButtonRef = useRef<HTMLButtonElement>(null);
  const simulatorRef = useRef<TodoSimulator | null>(null);
  const runnerRef = useRef<TestRunner | null>(null);

  const handleTestComplete = useCallback(
    (state: TestState & { scenario?: TestScenario }) => {
      setTestState(state);
      setShowApp(true);

      // Show success toast
      const testTypeLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      const scenarioLabel =
        activeTab === 'interaction' && state.scenario
          ? ` - ${state.scenario.charAt(0).toUpperCase() + state.scenario.slice(1)}`
          : '';

      toast({
        title: 'Test Results Saved',
        description: `Successfully saved ${state.results.length} ${testTypeLabel}${scenarioLabel} test results for "${testName}"`,
        duration: 3000,
        className:
          'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-800 dark:text-green-200',
      });
    },
    [activeTab, testName, toast],
  );

  const handleTestProgress = (current: number, total: number) => {
    setTestState(prev => ({
      ...prev,
      currentTest: current,
      totalTests: total,
    }));
  };

  const handleStartTest = (config: TestConfig) => {
    if (!runnerRef.current) return;

    // Update runner config
    runnerRef.current.updateConfig(config);

    // Reset state
    setTestState({
      isRunning: true,
      currentTest: 0,
      totalTests: config.testCount,
      results: [],
      summary: '',
      componentSummaries: [],
    });

    // Hide app for mount tests
    if (config.testType === 'mount') {
      setShowApp(false);
    }

    // Start test
    runnerRef.current.startTest();
  };

  const handleStopTest = () => {
    if (!runnerRef.current) return;

    // Show toast first to indicate test is being stopped
    toast({
      title: 'Test Stopped',
      description: 'Test was stopped manually. Results were not saved.',
      duration: 3000,
      className:
        'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-200',
    });

    // Stop test
    runnerRef.current.stopTest();

    // Clear test state since it was stopped manually
    setTestState({
      isRunning: false,
      currentTest: 0,
      totalTests: 0,
      results: [],
      summary: '',
      componentSummaries: [],
    });

    // Show app
    setShowApp(true);
  };

  const handleProfilerRender: ExtendedProfilerOnRenderCallback = (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
  ) => {
    if (!runnerRef.current) return;

    runnerRef.current.addMetric({
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    });
  };

  // Initialize simulator and runner
  useEffect(() => {
    if (!simulatorRef.current) {
      simulatorRef.current = new TodoSimulator('Performance Test Todo');
    }

    if (!runnerRef.current) {
      runnerRef.current = new TestRunner(
        simulatorRef.current,
        { testName, testType: activeTab, testCount: 0 },
        handleTestComplete,
        handleTestProgress,
        () => setShowApp(prev => !prev),
      );
    } else {
      runnerRef.current.setToggleAppVisibility(() => setShowApp(prev => !prev));
    }
  }, [activeTab, handleTestComplete, testName]);

  // Update test name in runner when it changes
  useEffect(() => {
    if (runnerRef.current) {
      runnerRef.current.updateConfig({
        testName,
        testType: activeTab,
        testCount: testState.totalTests,
      });
    }
  }, [testName, activeTab, testState.totalTests]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>React Compiler Performance Test</CardTitle>
          <CardDescription>
            Test the performance of your React application with and without React Compiler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestControls
            testName={testName}
            onTestNameChange={setTestName}
            onStartTest={handleStartTest}
            onStopTest={handleStopTest}
            isRunning={testState.isRunning}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            defaultSettings={{
              updateTestCount,
              mountTestCount,
              interactionTestCount,
              defaultScenario,
              defaultTodoText,
              customScenarios: allCustomScenarios,
            }}
          />
          <TestProgress
            currentTest={testState.currentTest}
            totalTests={testState.totalTests}
            isRunning={testState.isRunning}
          />
        </CardContent>
      </Card>

      <ProfilerProvider onRender={handleProfilerRender} isRunning={testState.isRunning}>
        <StatisticsProfiler id="TodoApp">
          <div className="relative">
            {showApp ? (
              children
            ) : (
              <div className="flex justify-center items-center h-64 border rounded-lg bg-gray-100">
                <p className="text-gray-500">App unmounted for testing...</p>
              </div>
            )}

            {/* Hidden references to find the add todo form */}
            {showApp && (
              <div className="hidden">
                <Input
                  ref={todoInputRef}
                  data-testid="todo-input-ref"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute opacity-0"
                />
                <Button
                  ref={addTodoButtonRef}
                  data-testid="add-todo-button-ref"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute opacity-0"
                />
              </div>
            )}
          </div>
        </StatisticsProfiler>
      </ProfilerProvider>

      <TestResults
        state={testState}
        testName={testName}
        testType={activeTab}
        scenario={activeTab === 'interaction' ? testState.scenario : undefined}
      />

      <Toaster />
    </div>
  );
}
