'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Todo } from '@/lib/types';
import RenderCounter from '../render-counter';
import { calculateTodoStats } from '@/lib/calculations';

interface TodoStatsProps {
  todos: Todo[];
}

export default function AutoMemoizedTodoStats({ todos }: TodoStatsProps) {
  'use memo';

  const stats = calculateTodoStats(todos);

  return (
    <div className="relative">
      <RenderCounter componentName="TodoStats" position="right" showArrow={true} />
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold">{todos.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${stats.percentComplete}%` }}></div>
            </div>
            <p className="text-xs text-center mt-1 text-gray-500">{stats.percentComplete}% complete</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
