'use client';

import type React from 'react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { TestPhase } from '@/lib/performance/types';
import type {
  ComponentComparison,
  TestResult,
  ChartDataPoint,
  ComparisonDataPoint,
  TimelineDataPoint,
  FlameGraphNode,
  StatisticsData,
  ComponentStatistics,
  ProfilerMetric,
  ComponentSummary,
} from '@/lib/types';

// Import the new components
import FilterOptions from '@/components/compare/filter-options';
import SavedResultsList from '@/components/compare/saved-results-list';
import PerformanceCharts from '@/components/compare/performance-charts';
import StatisticalAnalysis from '@/components/compare/statistical-analysis';
import ComponentComparisonTable from '@/components/compare/component-comparison-table';
import DeveloperEffortAnalysis from '@/components/compare/developer-effort-analysis';
import { TestDescriptions } from '@/lib/test-decriptions';

// Helper function to calculate p75 for an array of numbers
const calculateP75 = (values: number[]) => {
  if (values.length === 0) return 0;
  const sortedValues = [...values].sort((a, b) => a - b);
  const p75Index = Math.ceil(sortedValues.length * 0.75) - 1;
  return sortedValues[p75Index];
};

// Helper function to generate colors for charts
const generateColors = (count: number) => {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
  ];

  return Array(count)
    .fill(0)
    .map((_, i) => colors[i % colors.length]);
};

// Helper function to format time values
const formatTime = (time: number) => {
  return time.toFixed(3);
};

// Helper function to format percentage values
const formatPercentage = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return '0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

// Helper function to convert component summaries to flame graph data
const createFlameGraphData = (result: TestResult): FlameGraphNode => {
  // Sort summaries by component ID to maintain hierarchy
  const sortedSummaries = [...result.summaries].sort((a, b) => {
    // Put TodoApp at the top
    if (a.componentId.includes('TodoApp') && !a.componentId.includes('Component')) return -1;
    if (b.componentId.includes('TodoApp') && !b.componentId.includes('Component')) return 1;

    // Then TodoApp-Component
    if (a.componentId === 'TodoApp-Component') return -1;
    if (b.componentId === 'TodoApp-Component') return 1;

    // Then other components
    return a.componentId.localeCompare(b.componentId);
  });

  // Create a map of component IDs to their summaries
  const componentMap = new Map<string, ComponentSummary>();
  sortedSummaries.forEach(summary => {
    componentMap.set(summary.componentId, summary);
  });

  // Create the root node
  const rootNode: FlameGraphNode = {
    id: result.testDescription,
    value: 0,
    children: [],
  };

  // Add all components as children of the root
  sortedSummaries.forEach(summary => {
    const node: FlameGraphNode = {
      id: summary.componentId,
      value: summary.statistics.actualDuration.mean,
      tooltip: `Actual Duration: ${summary.statistics.actualDuration.mean.toFixed(3)} ms\nBase Duration: ${summary.statistics.baseDuration.mean.toFixed(3)} ms\nCommit Time: ${summary.statistics.commitTime.mean.toFixed(3)} ms\nStart Time: ${new Date(summary.statistics.startTime.mean).toLocaleTimeString()}`,
      children: [],
    };

    // For TodoItem components, group them under a parent node
    if (summary.componentId.startsWith('TodoItem-Component-')) {
      // Check if we already have a TodoItems parent
      let todoItemsParent = rootNode.children?.find(child => child.id === 'TodoItems');

      if (!todoItemsParent) {
        todoItemsParent = {
          id: 'TodoItems',
          value: 0,
          children: [],
        };
        rootNode.children?.push(todoItemsParent);
      }

      todoItemsParent.value += node.value;
      todoItemsParent.children?.push(node);
    } else {
      rootNode.children?.push(node);
    }

    rootNode.value += node.value;
  });

  return rootNode;
};

// Update the PerformanceCharts props type
type PerformanceChartsTabType =
  | 'actualDuration'
  | 'baseDuration'
  | 'commitTime'
  | 'startTime'
  | 'timeline'
  | 'distribution'
  | 'comparison'
  | 'flamegraph'
  | 'componentSummary';

export default function ComparePage() {
  const [savedResults, setSavedResults] = useState<TestResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<TestResult[]>([]);
  const [availableComponentIds, setAvailableComponentIds] = useState<string[]>([]);
  const [availableTestTypes, setAvailableTestTypes] = useState<string[]>([]);

  // Initialize state with default values
  const [activeTab, setActiveTab] = useState<PerformanceChartsTabType>('actualDuration');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedTestType, setSelectedTestType] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<TestPhase>('update');
  const [selectedStatistic, setSelectedStatistic] = useState<'mean' | 'median' | 'p75' | 'p95' | 'p99' | 'min' | 'max'>(
    'mean',
  );
  const [selectedTimelineMetric, setSelectedTimelineMetric] = useState<
    'actualDuration' | 'baseDuration' | 'commitTime' | 'startTime'
  >('actualDuration');
  const [comparisonType, setComparisonType] = useState<'absolute' | 'relative'>('absolute');
  const [visibleTimelineSeries, setVisibleTimelineSeries] = useState<Set<string>>(new Set());
  const [selectedFlameGraphResult, setSelectedFlameGraphResult] = useState<TestResult | null>(null);
  const [baselineResult, setBaselineResult] = useState<TestResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for component comparison table sorting and filtering
  const [componentSortColumn, setComponentSortColumn] = useState<keyof ComponentComparison | null>(null);
  const [componentSortDirection, setComponentSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [componentFilterText, setComponentFilterText] = useState('');

  // Determine selected result types for conditional rendering
  const hasAuto = !!selectedResults.find(r => r.testDescription.includes(TestDescriptions.AutoMemoized));
  const hasManual = !!selectedResults.find(r => r.testDescription.includes(TestDescriptions.ManuallyMemoized));
  const hasUnoptimized = !!selectedResults.find(r => r.testDescription.includes(TestDescriptions.UnMemoized));

  const selectedTypes = [hasAuto, hasManual, hasUnoptimized].filter(Boolean).length;

  // Load saved results from localStorage on component mount
  useEffect(() => {
    const loadSavedResults = () => {
      const storedResults = localStorage.getItem('performanceTestResults');
      if (storedResults) {
        try {
          const parsedResults = JSON.parse(storedResults) as TestResult[];

          // Add p75 to statistics if it doesn't exist
          parsedResults.forEach(result => {
            result.summaries.forEach((summary: ComponentSummary) => {
              // Add p75 to actualDuration if it doesn't exist
              if (summary.statistics.actualDuration && !summary.statistics.actualDuration.p75) {
                if (summary.rawMetrics && summary.rawMetrics.length > 0) {
                  const actualDurations = summary.rawMetrics.map((m: ProfilerMetric) => m.actualDuration);
                  summary.statistics.actualDuration.p75 = calculateP75(actualDurations);
                } else {
                  // Estimate p75 if raw metrics aren't available
                  summary.statistics.actualDuration.p75 =
                    summary.statistics.actualDuration.median +
                    (summary.statistics.actualDuration.p95 - summary.statistics.actualDuration.median) * 0.5;
                }
              }

              // Add p75 to baseDuration if it doesn't exist
              if (summary.statistics.baseDuration && !summary.statistics.baseDuration.p75) {
                if (summary.rawMetrics && summary.rawMetrics.length > 0) {
                  const baseDurations = summary.rawMetrics.map((m: ProfilerMetric) => m.baseDuration);
                  summary.statistics.baseDuration.p75 = calculateP75(baseDurations);
                } else {
                  // Estimate p75 if raw metrics aren't available
                  summary.statistics.baseDuration.p75 =
                    summary.statistics.baseDuration.median +
                    (summary.statistics.baseDuration.p95 - summary.statistics.baseDuration.median) * 0.5;
                }
              }

              // Add p75 to commitTime if it doesn't exist
              if (summary.statistics.commitTime && !summary.statistics.commitTime.p75) {
                if (summary.rawMetrics && summary.rawMetrics.length > 0) {
                  const commitTimes = summary.rawMetrics.map((m: ProfilerMetric) => m.commitTime);
                  summary.statistics.commitTime.p75 = calculateP75(commitTimes);
                } else {
                  // Estimate p75 if raw metrics aren't available
                  summary.statistics.commitTime.p75 =
                    summary.statistics.commitTime.median +
                    (summary.statistics.commitTime.p95 - summary.statistics.commitTime.median) * 0.5;
                }
              }

              // Add p75 to startTime if it doesn't exist
              if (summary.statistics.startTime && !summary.statistics.startTime.p75) {
                if (summary.rawMetrics && summary.rawMetrics.length > 0) {
                  const startTimes = summary.rawMetrics.map((m: ProfilerMetric) => m.startTime);
                  summary.statistics.startTime.p75 = calculateP75(startTimes);
                } else {
                  // Estimate p75 if raw metrics aren't available
                  summary.statistics.startTime.p75 =
                    summary.statistics.startTime.median +
                    (summary.statistics.startTime.p95 - summary.statistics.startTime.median) * 0.5;
                }
              }
            });
          });

          setSavedResults(parsedResults);

          // Extract all unique component IDs and test types
          const componentIds = new Set<string>();
          const testTypes = new Set<string>();

          parsedResults.forEach(result => {
            testTypes.add(result.testType);

            result.summaries.forEach((summary: ComponentSummary) => {
              componentIds.add(summary.componentId);
            });
          });

          const availableIdsArray = Array.from(componentIds);
          setAvailableComponentIds(availableIdsArray);
          setAvailableTestTypes(Array.from(testTypes));

          // Set default selected component to the first available if none is selected
          if (selectedComponentId === null && availableIdsArray.length > 0) {
            setSelectedComponentId(availableIdsArray[0]);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error parsing saved results:', error);
        }
      }
    };

    loadSavedResults();
  }, []); // Empty dependency array to run only once on mount

  // Update flame graph and baseline when selected results change
  useEffect(() => {
    if (selectedResults.length > 0) {
      // Ensure selected flame graph result is still in the selection
      if (!selectedFlameGraphResult || !selectedResults.includes(selectedFlameGraphResult)) {
        setSelectedFlameGraphResult(selectedResults[0]);
      }

      // Ensure baseline result is still in the selection
      if (!baselineResult || !selectedResults.includes(baselineResult)) {
        setBaselineResult(selectedResults[0]);
      }
      // Default to showing all selected results in timeline when selection changes
      setVisibleTimelineSeries(
        new Set(
          selectedResults.map(
            result => `${result.testDescription} (${result.testType}${result.scenario ? ` - ${result.scenario}` : ''})`,
          ),
        ),
      );
    } else {
      // Clear selections if no results are selected
      setSelectedFlameGraphResult(null);
      setBaselineResult(null);
      setVisibleTimelineSeries(new Set());
    }
  }, [selectedResults]); // Depend on selectedResults to update when selection changes

  // Handle file upload (already updates savedResults, which triggers the above effect)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const result = JSON.parse(e.target?.result as string);

        // Check if it's a single test result or an array
        const newResults = Array.isArray(result) ? result : [result];

        // Extract the test result data
        const processedResults = newResults.map(res => {
          const processedResult = {
            timestamp: res.timestamp || new Date().toISOString(),
            testDescription: res.testDescription || 'Imported Test',
            testType: res.testType || 'unknown',
            scenario: res.scenario,
            summaries: res.summary?.componentSummaries || res.summaries || [],
          };

          // Add p75 to statistics if it doesn't exist
          processedResult.summaries.forEach((summary: ComponentSummary) => {
            // Add p75 to actualDuration if it doesn't exist
            if (summary.statistics.actualDuration && !summary.statistics.actualDuration.p75) {
              if (summary.rawMetrics && summary.rawMetrics.length > 0) {
                const actualDurations = summary.rawMetrics.map((m: ProfilerMetric) => m.actualDuration);
                summary.statistics.actualDuration.p75 = calculateP75(actualDurations);
              } else {
                // Estimate p75 if raw metrics aren't available
                summary.statistics.actualDuration.p75 =
                  summary.statistics.actualDuration.median +
                  (summary.statistics.actualDuration.p95 - summary.statistics.actualDuration.median) * 0.5;
              }
            }

            // Add p75 to baseDuration if it doesn't exist
            if (summary.statistics.baseDuration && !summary.statistics.baseDuration.p75) {
              if (summary.rawMetrics && summary.rawMetrics.length > 0) {
                const baseDurations = summary.rawMetrics.map((m: ProfilerMetric) => m.baseDuration);
                summary.statistics.baseDuration.p75 = calculateP75(baseDurations);
              } else {
                // Estimate p75 if raw metrics aren't available
                summary.statistics.baseDuration.p75 =
                  summary.statistics.baseDuration.median +
                  (summary.statistics.baseDuration.p95 - summary.statistics.baseDuration.p95) * 0.5; // Corrected: Should use max, not p95
              }
            }

            // Add p75 to commitTime if it doesn't exist
            if (summary.statistics.commitTime && !summary.statistics.commitTime.p75) {
              if (summary.rawMetrics && summary.rawMetrics.length > 0) {
                const commitTimes = summary.rawMetrics.map((m: ProfilerMetric) => m.commitTime);
                summary.statistics.commitTime.p75 = calculateP75(commitTimes);
              } else {
                // Estimate p75 if raw metrics aren't available
                summary.statistics.commitTime.p75 =
                  summary.statistics.commitTime.median +
                  (summary.statistics.commitTime.p95 - summary.statistics.commitTime.median) * 0.5;
              }
            }

            // Add p75 to startTime if it doesn't exist
            if (summary.statistics.startTime && !summary.statistics.startTime.p75) {
              if (summary.rawMetrics && summary.rawMetrics.length > 0) {
                const startTimes = summary.rawMetrics.map((m: ProfilerMetric) => m.startTime);
                summary.statistics.startTime.p75 = calculateP75(startTimes);
              } else {
                // Estimate p75 if raw metrics aren't available
                summary.statistics.startTime.p75 =
                  summary.statistics.startTime.median +
                  (summary.statistics.startTime.p95 - summary.statistics.startTime.median) * 0.5;
              }
            }
          });

          return processedResult;
        });

        // Add to saved results
        const updatedResults = [...savedResults, ...processedResults];
        setSavedResults(updatedResults);
        localStorage.setItem('performanceTestResults', JSON.stringify(updatedResults));

        // Update available component IDs, phases, and test types
        const componentIds = new Set(availableComponentIds);
        const testTypes = new Set(availableTestTypes);

        processedResults.forEach(result => {
          testTypes.add(result.testType);

          result.summaries.forEach((summary: ComponentSummary) => {
            componentIds.add(summary.componentId);
          });
        });

        setAvailableComponentIds(Array.from(componentIds));
        setAvailableTestTypes(Array.from(testTypes));

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error parsing uploaded file:', error);
        alert('Invalid file format. Please upload a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Toggle selection of a test result
  const toggleResultSelection = (result: TestResult) => {
    setSelectedResults(prev => {
      if (prev.includes(result)) {
        return prev.filter(r => r !== result);
      } else {
        return [...prev, result];
      }
    });
  };

  // Clear all saved results
  const clearAllResults = () => {
    if (confirm('Are you sure you want to delete all saved test results?')) {
      localStorage.removeItem('performanceTestResults');
      setSavedResults([]);
      setSelectedResults([]);
      setAvailableComponentIds([]);
      setAvailableTestTypes([]);
      setSelectedComponentId(null);
      setSelectedTestType(null);
      setSelectedFlameGraphResult(null);
      setBaselineResult(null);
    }
  };

  // Filter results based on selected criteria
  const filteredResults = savedResults.filter(result => {
    // Filter by test type if selected
    if (selectedTestType && result.testType !== selectedTestType) {
      return false;
    }

    // Check if the result has the selected component
    if (selectedComponentId) {
      return result.summaries.some(summary => summary.componentId === selectedComponentId);
    }

    return true;
  });

  // Prepare chart data for the selected component
  const prepareChartData = useMemo(() => {
    if (!selectedComponentId) return [];

    return selectedResults
      .map(result => {
        const summary = result.summaries.find(s => s.componentId === selectedComponentId);
        if (!summary) return null;

        // Only include metrics for the selected phase
        const phaseMetrics = summary.statistics.phase[selectedPhase];
        if (phaseMetrics === 0) return null;

        return {
          name: `${result.testDescription} (${result.testType}${result.scenario ? ` - ${result.scenario}` : ''})`,
          actualDuration: summary.statistics.actualDuration[selectedStatistic],
          baseDuration: summary.statistics.baseDuration[selectedStatistic],
          commitTime: summary.statistics.commitTime[selectedStatistic],
          startTime: summary.statistics.startTime[selectedStatistic],
          timestamp: new Date(result.timestamp).toLocaleString(),
          min: summary.statistics.actualDuration.min,
          max: summary.statistics.actualDuration.max,
          median: summary.statistics.actualDuration.median,
          p75: summary.statistics.actualDuration.p75,
          mean: summary.statistics.actualDuration.mean,
          p95: summary.statistics.actualDuration.p95,
          p99: summary.statistics.actualDuration.p99,
          mode: summary.statistics.actualDuration.mode,
          testId: result.timestamp,
        };
      })
      .filter(Boolean) as ChartDataPoint[];
  }, [selectedResults, selectedComponentId, selectedStatistic, selectedPhase]);

  // Prepare comparison data for the selected component
  const prepareComparisonData = useMemo(() => {
    if (!selectedComponentId || !baselineResult || selectedResults.length <= 1) return [];

    const baselineSummary = baselineResult.summaries.find(s => s.componentId === selectedComponentId);
    if (!baselineSummary) return [];

    // Only include metrics for the selected phase
    const baselinePhaseMetrics = baselineSummary.statistics.phase[selectedPhase];
    if (baselinePhaseMetrics === 0) return [];

    const baselineActualDuration = baselineSummary.statistics.actualDuration[selectedStatistic];
    const baselineBaseDuration = baselineSummary.statistics.baseDuration[selectedStatistic];
    const baselineCommitTime = baselineSummary.statistics.commitTime[selectedStatistic];
    const baselineStartTime = baselineSummary.statistics.startTime[selectedStatistic];

    return selectedResults
      .filter(result => result !== baselineResult)
      .map(result => {
        const summary = result.summaries.find(s => s.componentId === selectedComponentId);
        if (!summary) return null;

        // Only include metrics for the selected phase
        const phaseMetrics = summary.statistics.phase[selectedPhase];
        if (phaseMetrics === 0) return null;

        const actualDuration = summary.statistics.actualDuration[selectedStatistic];
        const baseDuration = summary.statistics.baseDuration[selectedStatistic];
        const commitTime = summary.statistics.commitTime[selectedStatistic];
        const startTime = summary.statistics.startTime[selectedStatistic];

        // Calculate absolute differences
        const actualDurationDiff = actualDuration - baselineActualDuration;
        const baseDurationDiff = baseDuration - baselineBaseDuration;
        const commitTimeDiff = commitTime - baselineCommitTime;
        const startTimeDiff = startTime - baselineStartTime;

        // Calculate relative differences (percentage)
        const actualDurationPercentage = (actualDurationDiff / baselineActualDuration) * 100;
        const baseDurationPercentage = (baseDurationDiff / baselineBaseDuration) * 100;
        const commitTimePercentage = (commitTimeDiff / baselineCommitTime) * 100;
        const startTimePercentage = (startTimeDiff / baselineStartTime) * 100;

        return {
          name: `${result.testDescription} (${result.testType}${result.scenario ? ` - ${result.scenario}` : ''})`,
          actualDurationDiff: comparisonType === 'absolute' ? actualDurationDiff : actualDurationPercentage,
          baseDurationDiff: comparisonType === 'absolute' ? baseDurationDiff : baseDurationPercentage,
          commitTimeDiff: comparisonType === 'absolute' ? commitTimeDiff : commitTimePercentage,
          startTimeDiff: comparisonType === 'absolute' ? startTimeDiff : startTimePercentage,
          actualDuration,
          baseDuration,
          commitTime,
          startTime,
          baselineActualDuration,
          baselineBaseDuration,
          baselineCommitTime,
          baselineStartTime,
          testId: result.timestamp,
        };
      })
      .filter(Boolean) as ComparisonDataPoint[];
  }, [selectedResults, selectedComponentId, baselineResult, selectedStatistic, selectedPhase, comparisonType]);

  // Prepare timeline data
  const { timelineData, maxMeasurementIndex } = useMemo(() => {
    if (!selectedComponentId || selectedResults.length === 0) return { timelineData: [], maxMeasurementIndex: 100 };

    const timelineData: TimelineDataPoint[] = [];

    selectedResults.forEach(result => {
      const summary = result.summaries.find(s => s.componentId === selectedComponentId);
      if (!summary || !summary.rawMetrics) return;

      // Group metrics by test iteration
      const metricsByTest = summary.rawMetrics.reduce(
        (acc, metric, index) => {
          const iterationId = `${index}`; // Use index as iteration ID since testId is not available
          if (!acc[iterationId]) {
            acc[iterationId] = [];
          }
          acc[iterationId].push(metric);
          return acc;
        },
        {} as Record<string, typeof summary.rawMetrics>,
      );

      // Calculate statistics for each test iteration
      Object.entries(metricsByTest).forEach(([iterationId, metrics], index) => {
        const values = metrics.map(m => m.actualDuration).sort((a, b) => a - b);
        let value: number;
        let mid: number;
        let p75Index: number;
        let p95Index: number;
        let p99Index: number;

        switch (selectedStatistic) {
          case 'mean':
            value = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'median':
            mid = Math.floor(values.length / 2);
            value = values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
            break;
          case 'p75':
            p75Index = Math.floor(values.length * 0.75);
            value = values[p75Index];
            break;
          case 'p95':
            p95Index = Math.floor(values.length * 0.95);
            value = values[p95Index];
            break;
          case 'p99':
            p99Index = Math.floor(values.length * 0.99);
            value = values[p99Index];
            break;
          case 'min':
            value = values[0];
            break;
          case 'max':
            value = values[values.length - 1];
            break;
          default:
            value = values.reduce((a, b) => a + b, 0) / values.length; // Default to mean
        }

        // Create a new data point with the calculated statistic
        timelineData.push({
          name: `${result.testDescription} (${result.testType}${result.scenario ? ` - ${result.scenario}` : ''})`,
          actualDuration: value, // This is the calculated statistic value
          baseDuration: metrics[0].baseDuration, // Keep the first base duration for reference
          commitTime: metrics[0].commitTime, // Keep the first commit time for reference
          startTime: metrics[0].startTime, // Keep the first start time for reference
          index,
          testId: result.timestamp,
          iterationId,
        });
      });
    });

    // Sort timeline data by index to ensure proper ordering
    const sortedTimelineData = timelineData.sort((a, b) => a.index - b.index);
    const calculatedMaxIndex = sortedTimelineData.length > 0 ? Math.max(...sortedTimelineData.map(d => d.index)) : 100;

    return { timelineData: sortedTimelineData, maxMeasurementIndex: calculatedMaxIndex };
  }, [selectedResults, selectedComponentId, selectedStatistic]);

  // Prepare distribution data for box plots
  const prepareDistributionData = useMemo(() => {
    if (!selectedComponentId || selectedResults.length === 0) return [];

    return selectedResults
      .map(result => {
        const summary = result.summaries.find(s => s.componentId === selectedComponentId);
        if (!summary) return null;

        // If we have raw metrics, use them for detailed distribution
        if (summary.rawMetrics && summary.rawMetrics.length > 0) {
          const actualDurations = summary.rawMetrics.map(m => m.actualDuration);

          return {
            name: `${result.testDescription} (${result.testType}${result.scenario ? ` - ${result.scenario}` : ''})`,
            actualDuration: actualDurations,
            min: summary.statistics.actualDuration.min,
            q1:
              summary.statistics.actualDuration.min +
              (summary.statistics.actualDuration.median - summary.statistics.actualDuration.min) / 2,
            median: summary.statistics.actualDuration.median,
            p75: summary.statistics.actualDuration.p75,
            q3:
              summary.statistics.actualDuration.median +
              (summary.statistics.actualDuration.max - summary.statistics.actualDuration.median) / 2,
            p95: summary.statistics.actualDuration.p95,
            p99: summary.statistics.actualDuration.p99,
            max: summary.statistics.actualDuration.max,
            testId: result.timestamp,
          };
        }

        // Otherwise, use the statistics we have
        return {
          name: `${result.testDescription} (${result.testType}${result.scenario ? ` - ${result.scenario}` : ''})`,
          min: summary.statistics.actualDuration.min,
          q1:
            summary.statistics.actualDuration.min +
            (summary.statistics.actualDuration.median - summary.statistics.actualDuration.min) / 2,
          median: summary.statistics.actualDuration.median,
          p75: summary.statistics.actualDuration.p75,
          q3:
            summary.statistics.actualDuration.median +
            (summary.statistics.actualDuration.max - summary.statistics.actualDuration.median) / 2,
          p95: summary.statistics.actualDuration.p95,
          p99: summary.statistics.actualDuration.p99,
          max: summary.statistics.actualDuration.max,
          mean: summary.statistics.actualDuration.mean,
          testId: result.timestamp,
        };
      })
      .filter(Boolean);
  }, [selectedResults, selectedComponentId]);

  // Add this function to analyze component performance
  const analyzeComponentPerformance = useMemo((): ComponentComparison[] | null => {
    if (selectedResults.length < 1) return null; // Need at least two for comparison

    const autoMemoizedResult = selectedResults.find(r => r.testDescription.includes(TestDescriptions.AutoMemoized));
    const manualMemoizedResult = selectedResults.find(r =>
      r.testDescription.includes(TestDescriptions.ManuallyMemoized),
    );
    const unoptimizedResult = selectedResults.find(r => r.testDescription.includes(TestDescriptions.UnMemoized));

    // Only proceed if at least two different types of results are selected from the three implementations
    if (selectedTypes < 2) return null;

    const components = availableComponentIds
      .map(componentId => {
        const autoSummary = autoMemoizedResult?.summaries.find(s => s.componentId === componentId);
        const manualSummary = manualMemoizedResult?.summaries.find(s => s.componentId === componentId);
        const unoptimizedSummary = unoptimizedResult?.summaries.find(s => s.componentId === componentId);

        // Only include components that exist in all selected results
        if ((hasAuto && !autoSummary) || (hasManual && !manualSummary) || (hasUnoptimized && !unoptimizedSummary)) {
          return null;
        }

        const autoDuration = autoSummary?.statistics.actualDuration[selectedStatistic] ?? NaN;
        const manualDuration = manualSummary?.statistics.actualDuration[selectedStatistic] ?? NaN;
        const unoptimizedDuration = unoptimizedSummary?.statistics.actualDuration[selectedStatistic] ?? NaN;

        let autoImprovement = NaN;
        let manualImprovement = NaN;
        let bestImplementation: 'auto' | 'manual' | 'unmemoized' | null = null;

        if (hasUnoptimized) {
          // Compare against unoptimized if available
          if (hasAuto && unoptimizedDuration > 0) {
            autoImprovement = ((unoptimizedDuration - autoDuration) / unoptimizedDuration) * 100;
          }
          if (hasManual && unoptimizedDuration > 0) {
            manualImprovement = ((unoptimizedDuration - manualDuration) / unoptimizedDuration) * 100;
          }

          // Determine best among available
          if (hasAuto && hasManual) {
            bestImplementation =
              autoDuration <= manualDuration && autoDuration <= unoptimizedDuration
                ? 'auto'
                : manualDuration <= autoDuration && manualDuration <= unoptimizedDuration
                  ? 'manual'
                  : 'unmemoized';
          } else if (hasAuto) {
            bestImplementation = autoDuration <= unoptimizedDuration ? 'auto' : 'unmemoized';
          } else if (hasManual) {
            bestImplementation = manualDuration <= unoptimizedDuration ? 'manual' : 'unmemoized';
          } else {
            bestImplementation = 'unmemoized'; // Only unoptimized is selected
          }
        } else if (hasAuto && hasManual) {
          // Compare auto vs manual if unoptimized is not available
          if (manualDuration > 0) {
            autoImprovement = ((manualDuration - autoDuration) / manualDuration) * 100; // Improvement relative to manual
            manualImprovement = 0; // Not applicable in this view
          }
          bestImplementation = autoDuration <= manualDuration ? 'auto' : 'manual';
        } else if (hasAuto) {
          bestImplementation = 'auto'; // Only auto is selected
        } else if (hasManual) {
          bestImplementation = 'manual'; // Only manual is selected
        }

        return {
          componentId,
          autoDuration,
          manualDuration,
          unoptimizedDuration,
          autoImprovement,
          manualImprovement,
          bestImplementation: bestImplementation as 'auto' | 'manual' | 'unmemoized',
        };
      })
      .filter((comparison): comparison is ComponentComparison => comparison !== null);

    return components;
  }, [selectedResults, selectedStatistic, availableComponentIds, selectedTypes, hasAuto, hasManual, hasUnoptimized]);

  // Filter and sort component comparison data
  const filteredAndSortedComponents = useMemo(() => {
    let components = analyzeComponentPerformance;

    if (!components) return [];

    // Apply filtering
    if (componentFilterText) {
      components = components.filter((c: ComponentComparison) =>
        c.componentId.toLowerCase().includes(componentFilterText.toLowerCase()),
      );
    }

    // Apply sorting
    if (componentSortColumn) {
      components.sort((a: ComponentComparison, b: ComponentComparison) => {
        const aValue = a[componentSortColumn];
        const bValue = b[componentSortColumn];

        if (aValue < bValue) return componentSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return componentSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return components;
  }, [componentFilterText, componentSortColumn, componentSortDirection, analyzeComponentPerformance]);

  // Handle column header click for sorting
  const handleComponentHeaderClick = (column: keyof ComponentComparison) => {
    if (componentSortColumn === column) {
      setComponentSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setComponentSortColumn(column);
      setComponentSortDirection('asc');
    }
  };

  // Update the handleTimelineLegendClick
  const handleTimelineLegendClick = useCallback(
    (e: { value: string }) => {
      const testName = e?.value;
      if (!testName || typeof testName !== 'string') return;

      setVisibleTimelineSeries((prev: Set<string>) => {
        const newSet = new Set(prev);
        if (newSet.has(testName)) {
          newSet.delete(testName);
        } else {
          newSet.add(testName);
        }
        // If all series are hidden, show all series
        if (newSet.size === 0) {
          selectedResults.forEach(result => {
            const testDescription = `${result.testDescription} (${result.testType}${result.scenario ? ` - ${result.scenario}` : ''})`;
            newSet.add(testDescription);
          });
        }
        return newSet;
      });
    },
    [selectedResults],
  );

  return (
    <TooltipProvider>
      <FilterOptions
        selectedComponentId={selectedComponentId}
        setSelectedComponentId={setSelectedComponentId}
        availableComponentIds={availableComponentIds}
        selectedTestType={selectedTestType}
        setSelectedTestType={setSelectedTestType}
        availableTestTypes={availableTestTypes}
        selectedPhase={selectedPhase}
        setSelectedPhase={setSelectedPhase}
        selectedStatistic={selectedStatistic}
        setSelectedStatistic={setSelectedStatistic}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SavedResultsList
          savedResults={savedResults}
          filteredResults={filteredResults}
          selectedResults={selectedResults}
          baselineResult={baselineResult}
          fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
          handleFileUpload={handleFileUpload}
          clearAllResults={clearAllResults}
          toggleResultSelection={toggleResultSelection}
          setBaselineResult={setBaselineResult}
        />

        <PerformanceCharts
          selectedResults={selectedResults}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedComponentId={selectedComponentId}
          selectedStatistic={selectedStatistic}
          baselineResult={baselineResult}
          comparisonType={comparisonType}
          setComparisonType={setComparisonType}
          selectedTimelineMetric={selectedTimelineMetric}
          setSelectedTimelineMetric={setSelectedTimelineMetric}
          selectedFlameGraphResult={selectedFlameGraphResult}
          setSelectedFlameGraphResult={setSelectedFlameGraphResult}
          visibleTimelineSeries={visibleTimelineSeries}
          handleTimelineLegendClick={handleTimelineLegendClick}
          prepareChartData={prepareChartData}
          prepareComparisonData={prepareComparisonData}
          prepareTimelineData={timelineData}
          prepareDistributionData={prepareDistributionData}
          createFlameGraphData={createFlameGraphData}
          formatTime={formatTime}
          formatPercentage={formatPercentage}
          generateColors={generateColors}
          maxMeasurementIndex={maxMeasurementIndex}
        />
      </div>

      <StatisticalAnalysis
        selectedResults={selectedResults}
        selectedComponentId={selectedComponentId}
        formatTime={formatTime}
      />

      <ComponentComparisonTable
        selectedResultsCount={selectedResults.length}
        hasUnoptimized={hasUnoptimized}
        hasAuto={hasAuto}
        hasManual={hasManual}
        selectedTypes={selectedTypes}
        componentFilterText={componentFilterText}
        setComponentFilterText={setComponentFilterText}
        componentSortColumn={componentSortColumn}
        componentSortDirection={componentSortDirection}
        handleComponentHeaderClick={handleComponentHeaderClick}
        filteredAndSortedComponents={filteredAndSortedComponents}
        formatTime={formatTime}
        formatPercentage={formatPercentage}
      />

      <DeveloperEffortAnalysis />
    </TooltipProvider>
  );
}

// Export types for use in other components
export type {
  StatisticsData,
  ComponentStatistics,
  ProfilerMetric,
  ComponentSummary,
  TestResult,
  FlameGraphNode,
  ChartDataPoint,
  TimelineDataPoint,
  ComparisonDataPoint,
  ComponentComparison,
};
