import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ComponentComparison } from '@/lib/types';

interface ComponentComparisonTableProps {
  selectedResultsCount: number;
  hasUnoptimized: boolean;
  hasAuto: boolean;
  hasManual: boolean;
  selectedTypes: number;
  componentFilterText: string;
  setComponentFilterText: React.Dispatch<React.SetStateAction<string>>;
  componentSortColumn: keyof ComponentComparison | null;
  componentSortDirection: 'asc' | 'desc' | null;
  handleComponentHeaderClick: (column: keyof ComponentComparison) => void;
  filteredAndSortedComponents: ComponentComparison[];
  formatTime: (time: number) => string;
  formatPercentage: (value: number) => string;
}

const ComponentComparisonTable: React.FC<ComponentComparisonTableProps> = ({
  selectedResultsCount,
  hasUnoptimized,
  hasAuto,
  hasManual,
  selectedTypes,
  componentFilterText,
  setComponentFilterText,
  componentSortColumn,
  componentSortDirection,
  handleComponentHeaderClick,
  filteredAndSortedComponents,
  formatTime,
  formatPercentage,
}) => {
  if (selectedResultsCount < 2) return null; // Need at least two for comparison

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Component Performance Comparison - Actual Duration</CardTitle>
        <CardDescription>Shows performance comparison between selected implementations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label htmlFor="componentFilter" className="block text-sm font-medium mb-1">
            Filter by Component Name
          </label>
          <Input
            id="componentFilter"
            type="text"
            placeholder="Enter component name..."
            value={componentFilterText}
            onChange={e => setComponentFilterText(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th
                  className="border p-2 text-left cursor-pointer"
                  onClick={() => handleComponentHeaderClick('componentId')}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      Component
                      {componentSortColumn === 'componentId' && (componentSortDirection === 'asc' ? ' ▲' : ' ▼')}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to sort by Component Name</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                {hasUnoptimized && (
                  <th
                    className="border p-2 text-left cursor-pointer"
                    onClick={() => handleComponentHeaderClick('unoptimizedDuration')}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        Unmemoized (ms)
                        {componentSortColumn === 'unoptimizedDuration' &&
                          (componentSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by Unmemoized Duration</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                )}
                {hasAuto && (
                  <th
                    className="border p-2 text-left cursor-pointer"
                    onClick={() => handleComponentHeaderClick('autoDuration')}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        Auto-Memoized (ms)
                        {componentSortColumn === 'autoDuration' && (componentSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by Auto-Memoized Duration</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                )}
                {hasManual && (
                  <th
                    className="border p-2 text-left cursor-pointer"
                    onClick={() => handleComponentHeaderClick('manualDuration')}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        Manual Memoized (ms)
                        {componentSortColumn === 'manualDuration' && (componentSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by Manual Memoized Duration</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                )}
                {/* Show Auto-Memo Improvement if Auto is selected and (Unoptimized or Manual) is selected */}
                {hasAuto && (hasUnoptimized || hasManual) && (
                  <th
                    className="border p-2 text-left cursor-pointer"
                    onClick={() => handleComponentHeaderClick('autoImprovement')}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        {hasUnoptimized ? 'Auto-Memo Improvement (vs Unmemoized)' : 'Auto-Memo Improvement (vs Manual)'}
                        {componentSortColumn === 'autoImprovement' && (componentSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by Auto-Memo Improvement</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                )}
                {/* Show Manual Memo Improvement if Manual is selected and Unoptimized is selected */}
                {hasManual && hasUnoptimized && (
                  <th
                    className="border p-2 text-left cursor-pointer"
                    onClick={() => handleComponentHeaderClick('manualImprovement')}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        Manual Memo Improvement (vs Unmemoized)
                        {componentSortColumn === 'manualImprovement' &&
                          (componentSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by Manual Memo Improvement</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                )}
                {selectedTypes >= 2 && (
                  <th
                    className="border p-2 text-left cursor-pointer"
                    onClick={() => handleComponentHeaderClick('bestImplementation')}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        Best Implementation
                        {componentSortColumn === 'bestImplementation' &&
                          (componentSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by Best Implementation</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedComponents.map((comparison, index) => (
                <tr
                  key={comparison.componentId}
                  className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                >
                  <td className="border p-2 font-medium">{comparison.componentId}</td>
                  {hasUnoptimized && <td className="border p-2">{formatTime(comparison.unoptimizedDuration)}</td>}
                  {hasAuto && <td className="border p-2">{formatTime(comparison.autoDuration)}</td>}
                  {hasManual && <td className="border p-2">{formatTime(comparison.manualDuration)}</td>}
                  {/* Show Auto-Memo Improvement if Auto is selected and (Unoptimized or Manual) is selected */}
                  {hasAuto && (hasUnoptimized || hasManual) && (
                    <td className="border p-2">
                      <span
                        className={
                          comparison.autoImprovement > 0
                            ? 'text-green-600 dark:text-green-400'
                            : comparison.autoImprovement < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                        }
                      >
                        {formatPercentage(comparison.autoImprovement)}
                      </span>
                    </td>
                  )}
                  {/* Show Manual Memo Improvement if Manual is selected and Unoptimized is selected */}
                  {hasManual && hasUnoptimized && (
                    <td className="border p-2">
                      <span
                        className={
                          comparison.manualImprovement > 0
                            ? 'text-green-600 dark:text-green-400'
                            : comparison.manualImprovement < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                        }
                      >
                        {formatPercentage(comparison.manualImprovement)}
                      </span>
                    </td>
                  )}
                  {selectedTypes >= 2 && (
                    <td className="border p-2">
                      <span
                        className={
                          comparison.bestImplementation === 'auto'
                            ? 'text-green-600 dark:text-green-400'
                            : comparison.bestImplementation === 'manual'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400'
                        }
                      >
                        {comparison.bestImplementation === 'auto'
                          ? 'Auto-Memo'
                          : comparison.bestImplementation === 'manual'
                            ? 'Manual Memo'
                            : 'Unmemoized'}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComponentComparisonTable;
