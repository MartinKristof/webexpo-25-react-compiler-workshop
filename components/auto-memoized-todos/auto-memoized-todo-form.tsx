'use client';

import type React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RenderCounter from '../render-counter';

interface TodoFormProps {
  onAddTodo: (text: string) => void;
}

export default function AutoMemoizedTodoForm({ onAddTodo }: TodoFormProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTodo(text.trim());
      setText('');
    }
  };

  return (
    <div className="relative">
      <RenderCounter componentName="TodoForm" position="right" showArrow={true} />
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1"
          data-testid="todo-input"
        />
        <Button type="submit" disabled={!text.trim()} data-testid="add-todo-button">
          Add
        </Button>
      </form>
    </div>
  );
}
