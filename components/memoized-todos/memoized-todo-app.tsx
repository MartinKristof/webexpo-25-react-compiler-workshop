'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RenderCounter from '../render-counter';
import type { Todo } from '@/lib/types';
import MemoizedTodoList from './memoized-todo-list';
import MemoizedTodoStats from './memoized-todo-stats';
import MemoizedTodoForm from './memoized-todo-form';
import { StatisticsProfiler } from '@/components/performance/statistics-profiler';
import { filterTodos } from '@/lib/calculations';

export default function MemoizedTodoApp() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Learn React Compiler', completed: false },
    { id: 2, text: 'Build a demo app', completed: true },
    { id: 3, text: 'Share with the team', completed: false },
  ]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Add a new todo
  const addTodo = useCallback((text: string) => {
    setTodos(prevTodos => [
      ...prevTodos,
      {
        id: Math.max(0, ...prevTodos.map(t => t.id)) + 1,
        text,
        completed: false,
      },
    ]);
  }, []);

  // Toggle a todo's completed status
  const toggleTodo = useCallback((id: number) => {
    setTodos(prevTodos => prevTodos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  }, []);

  // Delete a todo
  const deleteTodo = useCallback((id: number) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  }, []);

  // Change the filter
  const changeFilter = useCallback((newFilter: 'all' | 'active' | 'completed') => {
    setFilter(newFilter);
  }, []);

  const filteredTodos = useMemo(() => filterTodos(todos, filter), [todos, filter]);

  return (
    <StatisticsProfiler id="TodoApp-Component">
      <Card>
        <RenderCounter componentName="TodoApp" position="top-right" showArrow />
        <CardHeader>
          <CardTitle>Memoized manually Todo List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StatisticsProfiler id="TodoForm-Component">
            <MemoizedTodoForm onAddTodo={addTodo} />
          </StatisticsProfiler>

          <div className="flex justify-center space-x-4 mb-4">
            <button
              className={`px-3 py-1 rounded ${
                filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
              onClick={() => changeFilter('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 rounded ${
                filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
              onClick={() => changeFilter('active')}
            >
              Active
            </button>
            <button
              className={`px-3 py-1 rounded ${
                filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
              onClick={() => changeFilter('completed')}
            >
              Completed
            </button>
          </div>

          <StatisticsProfiler id="TodoList-Component">
            <MemoizedTodoList todos={filteredTodos} onToggle={toggleTodo} onDelete={deleteTodo} />
          </StatisticsProfiler>

          <StatisticsProfiler id="TodoStats-Component">
            <MemoizedTodoStats todos={todos} />
          </StatisticsProfiler>
        </CardContent>
      </Card>
    </StatisticsProfiler>
  );
}
