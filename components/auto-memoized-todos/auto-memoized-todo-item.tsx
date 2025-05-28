'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import RenderCounter from '../render-counter';
import type { Todo } from '@/lib/types';
import { StatisticsProfiler } from '../performance/statistics-profiler';
import { calculateTodoPriority } from '@/lib/calculations';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function AutoMemoizedTodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  'use memo';

  const priority = calculateTodoPriority(todo);

  return (
    <StatisticsProfiler id={`TodoItem-Component-${todo.id}`}>
      <div className="relative">
        <RenderCounter componentName={`TodoItem-${todo.id}`} position="right" showArrow={true} />
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => onToggle(todo.id)}
              id={`todo-${todo.id}`}
              data-testid={`todo-toggle-${todo.id}`}
            />
            <label
              htmlFor={`todo-${todo.id}`}
              className={`${todo.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}
            >
              {todo.text}
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500">Priority: {priority}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(todo.id)}
              className="h-8 w-8 text-red-500"
              data-testid={`todo-delete-${todo.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </StatisticsProfiler>
  );
}
