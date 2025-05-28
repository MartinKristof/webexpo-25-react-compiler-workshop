import type { Statistics } from './types';

// Helper function to calculate statistics for an array of numbers
export const calculateStatistics = (values: number[]): Statistics => {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, p75: 0, p95: 0, p99: 0, mode: 0 };
  }

  // Sort values for percentile calculations
  const sortedValues = [...values].sort((a, b) => a - b);

  // Calculate min and max
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];

  // Calculate mean (average)
  const sum = sortedValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / sortedValues.length;

  // Calculate median
  const mid = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 === 0 ? (sortedValues[mid - 1] + sortedValues[mid]) / 2 : sortedValues[mid];

  // Calculate percentiles
  const p75Index = Math.ceil(sortedValues.length * 0.75) - 1;
  const p95Index = Math.ceil(sortedValues.length * 0.95) - 1;
  const p99Index = Math.ceil(sortedValues.length * 0.99) - 1;

  const p75 = sortedValues[p75Index];
  const p95 = sortedValues[p95Index];
  const p99 = sortedValues[p99Index];

  // Calculate mode (most frequent value)
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = sortedValues[0];

  for (const value of sortedValues) {
    const roundedValue = Number(value.toFixed(3));
    frequency[roundedValue] = (frequency[roundedValue] || 0) + 1;
    if (frequency[roundedValue] > maxFreq) {
      maxFreq = frequency[roundedValue];
      mode = roundedValue;
    }
  }

  return { min, max, mean, median, p75, p95, p99, mode };
};

// Helper function to sort component IDs in the desired order
export const sortComponentIds = (componentIds: string[]): string[] => {
  // Define the order priority
  const orderPriority: { [key: string]: number } = {
    TodoApp: 1,
    'TodoApp-Component': 2,
    'TodoForm-Component': 3,
    'TodoList-Component': 4,
    'TodoStats-Component': 6,
  };

  return componentIds.sort((a, b) => {
    // Check if it's a TodoItem component
    const aIsTodoItem = a.startsWith('TodoItem-Component-');
    const bIsTodoItem = b.startsWith('TodoItem-Component-');

    // If both are TodoItem components, sort by their ID number
    if (aIsTodoItem && bIsTodoItem) {
      const aId = Number.parseInt(a.replace('TodoItem-Component-', ''), 10);
      const bId = Number.parseInt(b.replace('TodoItem-Component-', ''), 10);
      return aId - bId;
    }

    // If only a is TodoItem, it should come before TodoStats
    if (aIsTodoItem) return 5 - (orderPriority[b] || 99);

    // If only b is TodoItem, it should come before TodoStats
    if (bIsTodoItem) return (orderPriority[a] || 99) - 5;

    // Otherwise, sort by the predefined order
    return (orderPriority[a] || 99) - (orderPriority[b] || 99);
  });
};
