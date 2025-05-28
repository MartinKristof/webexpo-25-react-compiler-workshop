import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TestPhase } from '@/lib/performance/types';

interface FilterOptionsProps {
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
  availableComponentIds: string[];
  selectedTestType: string | null;
  setSelectedTestType: (type: string | null) => void;
  availableTestTypes: string[];
  selectedPhase: TestPhase;
  setSelectedPhase: (phase: TestPhase) => void;
  selectedStatistic: 'mean' | 'median' | 'p75' | 'p95' | 'p99' | 'min' | 'max';
  setSelectedStatistic: (statistic: 'mean' | 'median' | 'p75' | 'p95' | 'p99' | 'min' | 'max') => void;
}

const FilterOptions: React.FC<FilterOptionsProps> = ({
  selectedComponentId,
  setSelectedComponentId,
  availableComponentIds,
  selectedTestType,
  setSelectedTestType,
  availableTestTypes,
  selectedPhase,
  setSelectedPhase,
  selectedStatistic,
  setSelectedStatistic,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Filter Options</CardTitle>
        <CardDescription>Filter test results by component and test type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="componentSelect" className="block text-sm font-medium mb-1">
              Component
            </label>
            <Select
              value={selectedComponentId || 'all'}
              onValueChange={(value: string) => setSelectedComponentId(value === 'all' ? null : value)}
            >
              <SelectTrigger id="componentSelect">
                <SelectValue placeholder="Select a component" />
              </SelectTrigger>
              <SelectContent>
                {availableComponentIds.map(id => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="testTypeSelect" className="block text-sm font-medium mb-1">
              Test Type
            </label>
            <Select
              value={selectedTestType || 'all'}
              onValueChange={(value: string) => setSelectedTestType(value === 'all' ? null : value)}
            >
              <SelectTrigger id="testTypeSelect">
                <SelectValue placeholder="Select a test type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Test Types</SelectItem>
                {availableTestTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="phaseSelect" className="block text-sm font-medium mb-1">
              Phase
            </label>
            <Select value={selectedPhase} onValueChange={(value: TestPhase) => setSelectedPhase(value)}>
              <SelectTrigger id="phaseSelect">
                <SelectValue placeholder="Select a phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mount">Mount</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="nested_update">Nested Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="statisticSelect" className="block text-sm font-medium mb-1">
              Statistic
            </label>
            <Select
              value={selectedStatistic}
              onValueChange={(value: typeof selectedStatistic) => setSelectedStatistic(value)}
            >
              <SelectTrigger id="statisticSelect">
                <SelectValue placeholder="Select a statistic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mean">Mean (Average)</SelectItem>
                <SelectItem value="median">Median</SelectItem>
                <SelectItem value="p75">75th Percentile</SelectItem>
                <SelectItem value="p95">95th Percentile</SelectItem>
                <SelectItem value="p99">99th Percentile</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterOptions;
