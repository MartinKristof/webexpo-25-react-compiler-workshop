import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { Download } from 'lucide-react';
import FlameGraph from '@/components/flame-graph';
import type { TestResult, ChartDataPoint, ComparisonDataPoint, TimelineDataPoint, FlameGraphNode } from '@/lib/types';

interface PerformanceChartsProps {
  selectedResults: TestResult[];
  activeTab:
    | 'actualDuration'
    | 'baseDuration'
    | 'commitTime'
    | 'startTime'
    | 'timeline'
    | 'distribution'
    | 'comparison'
    | 'flamegraph'
    | 'componentSummary';
  setActiveTab: React.Dispatch<
    React.SetStateAction<
      | 'actualDuration'
      | 'baseDuration'
      | 'commitTime'
      | 'startTime'
      | 'timeline'
      | 'distribution'
      | 'comparison'
      | 'flamegraph'
      | 'componentSummary'
    >
  >;
  selectedComponentId: string | null;
  selectedStatistic: 'mean' | 'median' | 'p75' | 'p95' | 'p99' | 'min' | 'max';
  baselineResult: TestResult | null;
  comparisonType: 'absolute' | 'relative';
  setComparisonType: React.Dispatch<React.SetStateAction<'absolute' | 'relative'>>;
  selectedTimelineMetric: 'actualDuration' | 'baseDuration' | 'commitTime' | 'startTime';
  setSelectedTimelineMetric: React.Dispatch<
    React.SetStateAction<'actualDuration' | 'baseDuration' | 'commitTime' | 'startTime'>
  >;
  selectedFlameGraphResult: TestResult | null;
  setSelectedFlameGraphResult: React.Dispatch<React.SetStateAction<TestResult | null>>;
  visibleTimelineSeries: Set<string>;
  handleTimelineLegendClick: (e: { value: string }) => void;
  // Data preparation functions (will be passed as props)
  prepareChartData: ChartDataPoint[];
  prepareComparisonData: ComparisonDataPoint[];
  prepareTimelineData: TimelineDataPoint[];
  prepareDistributionData: Array<{
    name: string;
    min: number;
    q1: number;
    median: number;
    p75: number;
    q3: number;
    p95: number;
    p99: number;
    max: number;
    mean?: number;
    testId: string;
    actualDuration?: number[];
  } | null>;
  createFlameGraphData: (result: TestResult) => FlameGraphNode;
  // Helper functions (will be passed as props or defined locally if simple)
  formatTime: (time: number) => string;
  formatPercentage: (value: number) => string;
  generateColors: (count: number) => string[];
  maxMeasurementIndex: number;
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  selectedResults,
  activeTab,
  setActiveTab,
  selectedComponentId,
  selectedStatistic,
  baselineResult,
  comparisonType,
  setComparisonType,
  selectedTimelineMetric,
  setSelectedTimelineMetric,
  selectedFlameGraphResult,
  setSelectedFlameGraphResult,
  visibleTimelineSeries,
  handleTimelineLegendClick,
  prepareChartData,
  prepareComparisonData,
  prepareTimelineData,
  prepareDistributionData,
  createFlameGraphData,
  formatTime,
  formatPercentage,
  generateColors,
  maxMeasurementIndex,
}) => {
  const chartData = prepareChartData;
  const comparisonData = prepareComparisonData;
  const timelineData = prepareTimelineData;
  const distributionData = prepareDistributionData;
  const colors = generateColors(selectedResults.length);

  // Export chart as image (can be defined locally as it uses DOM manipulation)
  const exportChart = () => {
    const chartElement = document.querySelector('.recharts-wrapper svg');
    if (!chartElement) return;

    // Create a serialized SVG
    const svgData = new XMLSerializer().serializeToString(chartElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (canvas && ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(svgUrl);

        // Convert canvas to PNG
        const pngUrl = canvas.toDataURL('image/png');

        // Download the PNG
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `react-compiler-chart-${activeTab}-${new Date().toISOString().replace(/:/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };

    img.src = svgUrl;
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Performance Comparison</CardTitle>
        <CardDescription>
          {selectedResults.length === 0
            ? 'Select test results to compare'
            : `Comparing ${selectedResults.length} test results for ${selectedComponentId}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedResults.length > 0 ? (
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="actualDuration">Actual Duration</TabsTrigger>
              <TabsTrigger value="baseDuration">Base Duration</TabsTrigger>
              <TabsTrigger value="commitTime">Commit Time</TabsTrigger>
              <TabsTrigger value="startTime">Start Time</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="flamegraph">Flame Graph</TabsTrigger>
            </TabsList>

            {/* Actual Duration Tab */}
            <TabsContent value="actualDuration" className="pt-4">
              {selectedComponentId ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                      <YAxis
                        label={{
                          value: `${selectedStatistic} Time (ms)`,
                          angle: -90,
                          position: 'insideLeft',
                        }}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`${formatTime(value)} ms`]}
                        labelFormatter={(label: string) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="actualDuration" fill="#3b82f6" name={`Actual Duration (${selectedStatistic})`} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <p>Select a component to view comparison charts</p>
                </div>
              )}
            </TabsContent>

            {/* Base Duration Tab */}
            <TabsContent value="baseDuration" className="pt-4">
              {selectedComponentId ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                      <YAxis
                        label={{
                          value: `${selectedStatistic} Time (ms)`,
                          angle: -90,
                          position: 'insideLeft',
                        }}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`${formatTime(value)} ms`]}
                        labelFormatter={(label: string) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="baseDuration" fill="#10b981" name={`Base Duration (${selectedStatistic})`} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <p>Select a component to view comparison charts</p>
                </div>
              )}
            </TabsContent>

            {/* Commit Time Tab */}
            <TabsContent value="commitTime" className="pt-4">
              {selectedComponentId ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                      <YAxis
                        label={{
                          value: `${selectedStatistic} Time (ms)`,
                          angle: -90,
                          position: 'insideLeft',
                        }}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`${formatTime(value)} ms`]}
                        labelFormatter={(label: string) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="commitTime" fill="#f59e0b" name={`Commit Time (${selectedStatistic})`} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <p>Select a component to view comparison charts</p>
                </div>
              )}
            </TabsContent>

            {/* Start Time Tab */}
            <TabsContent value="startTime" className="pt-4">
              {selectedComponentId ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                      <YAxis
                        label={{
                          value: `${selectedStatistic} Time (ms)`,
                          angle: -90,
                          position: 'insideLeft',
                        }}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`${formatTime(value)} ms`]}
                        labelFormatter={(label: string) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="startTime" fill="#8b5cf6" name={`Start Time (${selectedStatistic})`} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-sm text-gray-500 text-center">
                    <p>
                      Start Time statistics show when React began rendering the update. The values are measured in
                      milliseconds from the start of the test.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <p>Select a component to view start time statistics</p>
                </div>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="pt-4">
              {selectedComponentId ? (
                <>
                  <div className="mb-4">
                    <label htmlFor="timelineMetricSelect" className="block text-sm font-medium mb-1">
                      Select Metric
                    </label>
                    <Select
                      value={selectedTimelineMetric}
                      onValueChange={(value: 'actualDuration' | 'baseDuration' | 'commitTime' | 'startTime') => {
                        setSelectedTimelineMetric(value);
                      }}
                    >
                      <SelectTrigger id="timelineMetricSelect">
                        <SelectValue placeholder="Select a metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actualDuration">Actual Duration</SelectItem>
                        <SelectItem value="baseDuration">Base Duration</SelectItem>
                        <SelectItem value="commitTime">Commit Time</SelectItem>
                        <SelectItem value="startTime">Start Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      key={`timeline-${selectedStatistic}-${selectedTimelineMetric}`}
                    >
                      <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="index"
                          label={{ value: 'Measurement Index', position: 'insideBottom', offset: -10 }}
                          type="number"
                          domain={[0, maxMeasurementIndex]}
                        />
                        <YAxis
                          label={{
                            value: `${selectedStatistic} ${selectedTimelineMetric === 'actualDuration' ? 'Duration' : selectedTimelineMetric === 'baseDuration' ? 'Duration' : 'Time'} (ms)`,
                            angle: -90,
                            position: 'insideLeft',
                          }}
                        />
                        <RechartsTooltip
                          formatter={(value: number) => [`${formatTime(value)} ms`]}
                          labelFormatter={(label: string) => `Measurement #${Number(label) + 1}`}
                        />
                        <Legend onClick={e => handleTimelineLegendClick(e)} />
                        {selectedResults.map((result, index) => {
                          const testDescription = `${result.testDescription} (${result.testType}${result.scenario ? ` - ${result.scenario}` : ''})`;
                          const isVisible = visibleTimelineSeries.has(testDescription);
                          return (
                            <Line
                              key={`${result.timestamp}-${selectedStatistic}-${selectedTimelineMetric}`}
                              type="monotone"
                              dataKey={selectedTimelineMetric}
                              data={isVisible ? timelineData.filter(d => d.testId === result.timestamp) : []}
                              name={testDescription}
                              stroke={colors[index]}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                              hide={!isVisible}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <p>Select a component to view timeline charts</p>
                </div>
              )}
            </TabsContent>

            {/* Distribution Tab */}
            <TabsContent value="distribution" className="pt-4">
              {selectedComponentId ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                      <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
                      <RechartsTooltip
                        formatter={(value: number | number[]) => [
                          `${formatTime(Array.isArray(value) ? value[0] : value)} ms`,
                        ]}
                        labelFormatter={(label: string) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="min" fill="#8884d8" name="Min" />
                      <Bar dataKey="median" fill="#82ca9d" name="Median" />
                      <Bar dataKey="p75" fill="#8dd1e1" name="75th Percentile" />
                      <Bar dataKey="p95" fill="#ffc658" name="95th Percentile" />
                      <Bar dataKey="p99" fill="#a4de6c" name="99th Percentile" />
                      <Bar dataKey="max" fill="#ff8042" name="Max" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <p>Select a component to view distribution charts</p>
                </div>
              )}
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="pt-4">
              {selectedComponentId && baselineResult && selectedResults.length > 1 ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm font-medium">Baseline: {baselineResult.testDescription}</p>
                      <p className="text-xs text-gray-500">
                        {baselineResult.testType}
                        {baselineResult.scenario ? ` - ${baselineResult.scenario}` : ''}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant={comparisonType === 'absolute' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setComparisonType('absolute')}
                      >
                        Absolute (ms)
                      </Button>
                      <Button
                        variant={comparisonType === 'relative' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setComparisonType('relative')}
                      >
                        Relative (%)
                      </Button>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                        <YAxis
                          label={{
                            value: comparisonType === 'absolute' ? 'Difference (ms)' : 'Difference (%)',
                            angle: -90,
                            position: 'insideLeft',
                          }}
                        />
                        <ReferenceLine y={0} stroke="#000" />
                        <RechartsTooltip
                          formatter={(value: number, name: string) => {
                            if (name === 'actualDurationDiff') {
                              if (comparisonType === 'absolute') {
                                return [`${formatTime(value)} ms`, 'Actual Duration Difference'];
                              } else {
                                return [`${formatPercentage(value)}`, 'Actual Duration Difference'];
                              }
                            } else if (name === 'baseDurationDiff') {
                              if (comparisonType === 'absolute') {
                                return [`${formatTime(value)} ms`, 'Base Duration Difference'];
                              } else {
                                return [`${formatPercentage(value)}`, 'Base Duration Difference'];
                              }
                            } else if (name === 'commitTimeDiff') {
                              if (comparisonType === 'absolute') {
                                return [`${formatTime(value)} ms`, 'Commit Time Difference'];
                              } else {
                                return [`${formatPercentage(value)}`, 'Commit Time Difference'];
                              }
                            }
                            return [value, name];
                          }}
                          labelFormatter={label => `${label} vs ${baselineResult.testDescription}`}
                        />
                        <Legend />
                        <Bar dataKey="actualDurationDiff" fill="#3b82f6" name="Actual Duration Difference" />
                        <Bar dataKey="baseDurationDiff" fill="#10b981" name="Base Duration Difference" />
                        <Bar dataKey="commitTimeDiff" fill="#f59e0b" name="Commit Time Difference" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <p className="text-center">
                      {comparisonType === 'absolute'
                        ? 'Negative values indicate better performance compared to baseline'
                        : 'Negative percentages indicate better performance compared to baseline'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <p>
                    {!selectedComponentId
                      ? 'Select a component to view comparison'
                      : !baselineResult
                        ? 'Select a baseline result for comparison'
                        : 'Select at least one more result to compare with baseline'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Flame Graph Tab */}
            <TabsContent value="flamegraph" className="pt-4">
              <div className="mb-4">
                <label htmlFor="flameGraphSelect" className="block text-sm font-medium mb-1">
                  Select Test Result for Flame Graph
                </label>
                <Select
                  value={selectedFlameGraphResult?.timestamp || ''}
                  onValueChange={(value: string) => {
                    const result = selectedResults.find(r => r.timestamp === value);
                    if (result) {
                      setSelectedFlameGraphResult(result);
                    }
                  }}
                >
                  <SelectTrigger id="flameGraphSelect">
                    <SelectValue placeholder="Select a test result" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedResults.map(result => (
                      <SelectItem key={result.timestamp} value={result.timestamp}>
                        {result.testDescription} ({result.testType}
                        {result.scenario ? ` - ${result.scenario}` : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFlameGraphResult ? (
                <div className="h-80 overflow-auto">
                  <FlameGraph
                    data={createFlameGraphData(selectedFlameGraphResult)}
                    width={1000}
                    height={200}
                    colorScheme="blue"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <p>Select a test result to view flame graph</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-gray-500">
            <p>Select test results from the left panel to compare</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={exportChart}
          disabled={selectedResults.length === 0 || !selectedComponentId || activeTab === 'flamegraph'}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Chart as Image
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PerformanceCharts;
