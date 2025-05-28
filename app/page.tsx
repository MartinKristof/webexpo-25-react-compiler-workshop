'use client';
import TodoApp from '@/components/todos/todo-app';
import PerformanceTester from '@/components/performance-tester';
import { TestDescriptions } from '@/lib/test-decriptions';

export default function UnMemoizedTodos() {
  return (
    <div className="max-w-3xl mx-auto">
      <PerformanceTester testDescription={TestDescriptions.UnMemoized}>
        <TodoApp />
      </PerformanceTester>
    </div>
  );
}
