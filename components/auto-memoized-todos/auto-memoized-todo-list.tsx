'use client';

import RenderCounter from '../render-counter';
import TodoItem from './auto-memoized-todo-item';
import type { Todo } from '@/lib/types';
import { calculateListComplexity } from '@/lib/calculations';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function AutoMemoizedTodoList({ todos, onToggle, onDelete }: TodoListProps) {
  'use memo';

  const complexity = calculateListComplexity(todos);

  return (
    <div className="relative">
      <RenderCounter componentName="TodoList" position="top-right" showArrow={true} />
      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-center text-gray-500">No todos to display</p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">List complexity score: {complexity}</p>
            {todos.map(todo => (
              <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
