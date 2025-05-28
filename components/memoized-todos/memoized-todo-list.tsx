'use client';

import { memo, useCallback } from 'react';
import type { Todo } from '@/lib/types';
import MemoizedTodoItem from './memoized-todo-item';
import RenderCounter from '../render-counter';
import { calculateListComplexity } from '@/lib/calculations';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function MemoizedTodoList({ todos, onToggle, onDelete }: TodoListProps) {
  const calculateComplexity = useCallback(() => calculateListComplexity(todos), [todos]);
  const complexity = calculateComplexity();

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
              <MemoizedTodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(MemoizedTodoList);
