import type { Todo } from './types';

/**
 * Calculates the complexity score of a todo list by analyzing relationships between todos
 * This is an expensive calculation that benefits from memoization
 */
export function calculateListComplexity(todos: Todo[]): string {
  // Create a graph of todo relationships based on text similarity
  const relationships: number[][] = todos.map((todo, i) =>
    todos.map((otherTodo, j) => {
      if (i === j) return 0;
      // Calculate text similarity (expensive operation)
      const text1 = todo.text.toLowerCase();
      const text2 = otherTodo.text.toLowerCase();
      let similarity = 0;

      // Find common substrings (expensive operation)
      for (let len = 1; len <= Math.min(text1.length, text2.length); len++) {
        for (let i = 0; i <= text1.length - len; i++) {
          const substr = text1.slice(i, i + len);
          if (text2.includes(substr)) {
            similarity += len;
          }
        }
      }
      return similarity;
    }),
  );

  // Calculate graph metrics (expensive operation)
  const totalRelationships = relationships.reduce((sum, row) => sum + row.reduce((rowSum, val) => rowSum + val, 0), 0);

  // Calculate complexity based on relationships and todo properties
  const complexity = totalRelationships * 0.01 + todos.length * 0.1 + todos.filter(t => t.completed).length * 0.2;

  return complexity.toFixed(2);
}

/**
 * Calculates the priority score of a single todo item
 * This is an expensive calculation that benefits from memoization
 */
export function calculateTodoPriority(todo: Todo): string {
  // Simulate an expensive calculation using string operations and sorting
  const text = todo.text.toLowerCase();

  // Create a large array of character combinations
  const combinations: string[] = [];
  for (let i = 0; i < text.length; i++) {
    for (let j = i + 1; j < text.length; j++) {
      combinations.push(text.slice(i, j));
    }
  }

  // Sort all combinations (expensive operation)
  combinations.sort();

  // Calculate priority based on unique combinations and text properties
  const uniqueCombinations = new Set(combinations).size;
  const priority = uniqueCombinations * 0.01 + todo.id * 0.1 + (todo.completed ? 0.5 : 0.2);

  return priority.toFixed(2);
}

/**
 * Calculates statistics for a todo list
 * This is an expensive calculation that benefits from memoization
 */
export function calculateTodoStats(todos: Todo[]) {
  // Calculate actual stats
  const completed = todos.filter(todo => todo.completed).length;
  const active = todos.length - completed;
  const percentComplete = todos.length > 0 ? Math.round((completed / todos.length) * 100) : 0;

  return { completed, active, percentComplete };
}

/**
 * Filters todos based on the current filter type
 */
export function filterTodos(todos: Todo[], filter: 'all' | 'active' | 'completed'): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'completed':
      return todos.filter(todo => todo.completed);
    default:
      return todos;
  }
}
