'use client';
import PerformanceTester from '@/components/performance-tester';
import MemoizedTodoApp from '@/components/memoized-todos/memoized-todo-app';
import { TestDescriptions } from '@/lib/test-decriptions';

export default function MemoizedTodos() {
  return (
    <div className="max-w-3xl mx-auto">
      <PerformanceTester testDescription={TestDescriptions.ManuallyMemoized}>
        <MemoizedTodoApp />
      </PerformanceTester>
    </div>
  );
}
