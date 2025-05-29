export function calculateStatistics(values: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  p75: number;
  p95: number;
  p99: number;
  mode: number;
} {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      p75: 0,
      p95: 0,
      p99: 0,
      mode: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  // Calculate mode
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = 0;

  for (const value of values) {
    frequency[value] = (frequency[value] || 0) + 1;
    if (frequency[value] > maxFreq) {
      maxFreq = frequency[value];
      mode = value;
    }
  }

  return {
    min,
    max,
    mean,
    median,
    p75,
    p95,
    p99,
    mode,
  };
}

export function sortComponentIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    // Sort by component name first
    const aName = a.split('-')[0];
    const bName = b.split('-')[0];
    if (aName !== bName) {
      return aName.localeCompare(bName);
    }
    // Then by component number if present
    const aNum = parseInt(a.split('-').pop() || '0', 10);
    const bNum = parseInt(b.split('-').pop() || '0', 10);
    return aNum - bNum;
  });
}
