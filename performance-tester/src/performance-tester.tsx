import React, { Profiler, ProfilerOnRenderCallback, useCallback, useEffect, useRef, useState } from 'react';
import type { TestConfig, TestState, TestSimulator, TestResultData } from './types';
import { TestRunner } from './test-runner';

export interface PerformanceTesterProps {
  children: React.ReactNode;
  config: TestConfig;
  simulator: TestSimulator;
  onTestComplete?: (state: TestState) => void;
  onTestProgress?: (current: number, total: number) => void;
  autoStart?: boolean;
  componentId?: string;
}

const overlayStyles = {
  position: 'fixed' as const,
  top: '20px',
  right: '20px',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  color: 'white',
  padding: '1rem',
  borderRadius: '8px',
  zIndex: 9999,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  transition: 'transform 0.2s ease-in-out',
  transform: 'translateX(calc(100% - 40px))',
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
};

const expandedStyles = {
  transform: 'translateX(0)',
};

const buttonStyles = {
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  backgroundColor: '#4a5568',
  color: 'white',
  fontSize: '0.875rem',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: '#2d3748',
  },
  '&:disabled': {
    backgroundColor: '#718096',
    cursor: 'not-allowed',
  },
};

const toggleButtonStyles = {
  ...buttonStyles,
  padding: '0.5rem',
  minWidth: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const controlsStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.5rem',
  minWidth: '200px',
};

const rowStyles = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
};

const exportResults = (results: TestResultData[]) => {
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-test-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const PerformanceTester: React.FC<PerformanceTesterProps> = ({
  children,
  config,
  simulator,
  onTestComplete,
  onTestProgress,
  autoStart = false,
  componentId = 'PerformanceTester',
}) => {
  const handleTestComplete = useCallback(
    (state: TestState) => {
      const exportData = {
        testDescription: config.testName,
        testType: config.testType,
        summary: { totalTests: config.testCount, componentSummaries: state.componentSummaries },
        results: state.results,
      };
      setLastResult(exportData);
      if (onTestComplete) onTestComplete(state);
    },
    [config, onTestComplete],
  );

  const [runner] = useState(() => new TestRunner(simulator, config, handleTestComplete, onTestProgress || (() => {})));
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpanded, setIsExpanded] = useState(false);
  const startTimeRef = useRef<number>(0);
  const [lastResult, setLastResult] = useState<TestResultData | null>(null);

  useEffect(() => {
    if (autoStart) {
      runner.startTest();
    }
  }, [autoStart, runner]);

  const handleRender: ProfilerOnRenderCallback = (_id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    if (!isRunning) return;

    if (phase === 'mount' && startTimeRef.current === 0) {
      startTimeRef.current = startTime;
    }

    runner.addMetrics([
      {
        id: componentId,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      },
    ]);
  };

  const startTest = useCallback(() => {
    startTimeRef.current = 0;
    setIsRunning(true);
    runner.startTest();
  }, [runner]);

  const stopTest = useCallback(() => {
    setIsRunning(false);
    runner.stopTest();
  }, [runner]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleExport = useCallback(() => {
    if (lastResult) {
      exportResults([lastResult]);
    }
  }, [lastResult]);

  return (
    <>
      <div style={{ ...overlayStyles, ...(isExpanded ? expandedStyles : {}) }}>
        <button
          onClick={toggleExpanded}
          style={toggleButtonStyles}
          title={isExpanded ? 'Hide controls' : 'Show controls'}
        >
          {isExpanded ? '←' : '→'}
        </button>
        {isExpanded && (
          <div style={controlsStyles}>
            <div style={{ color: 'white', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{config.testName}</div>
            <div style={rowStyles}>
              <button onClick={startTest} disabled={isRunning} style={buttonStyles} title="Start performance test">
                Start
              </button>
              <button onClick={stopTest} disabled={!isRunning} style={buttonStyles} title="Stop performance test">
                Stop
              </button>
            </div>
            <button onClick={handleExport} style={buttonStyles} title="Export test results">
              Export Results
            </button>
          </div>
        )}
      </div>
      <Profiler id={componentId} onRender={handleRender}>
        {children}
      </Profiler>
    </>
  );
};
