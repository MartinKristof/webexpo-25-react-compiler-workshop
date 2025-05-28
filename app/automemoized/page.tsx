'use client';
import PerformanceTester from '@/components/performance-tester';
import AutoMemoizedTodoApp from '@/components/auto-memoized-todos/auto-memoized-todo-app';
import { TestDescriptions } from '@/lib/test-decriptions';

export default function AutoMemoizedTodos() {
  return (
    <div className="max-w-3xl mx-auto">
      <PerformanceTester
        testDescription={TestDescriptions.AutoMemoized}
        settings={{
          customScenarios: [
            {
              id: 'batchAddTodos',
              name: 'Batch Add Todos',
              description: 'Adds multiple todos in quick succession',
              run: async simulator => {
                for (let i = 0; i < 5; i++) {
                  await simulator.simulateAddTodo();
                  await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between adds
                }
              },
            },
          ],
        }}
      >
        <AutoMemoizedTodoApp />
      </PerformanceTester>
    </div>
  );
}
