'use client';

import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';
import { useProfiler } from '@/lib/performance/profiler';

interface StatisticsProfilerProps {
  id: string;
  children: ReactNode;
  onRender?: ProfilerOnRenderCallback;
}

export function StatisticsProfiler({ id, children, onRender }: StatisticsProfilerProps) {
  const { onRender: contextOnRender } = useProfiler();

  const handleRender: ProfilerOnRenderCallback = (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
  ) => {
    // Call the context onRender
    contextOnRender(id, phase, actualDuration, baseDuration, startTime, commitTime);

    // Then call the custom onRender if provided
    if (onRender) {
      onRender(id, phase, actualDuration, baseDuration, startTime, commitTime);
    }
  };

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
}
