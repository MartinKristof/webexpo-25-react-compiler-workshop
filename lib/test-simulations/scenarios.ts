import type { CustomTestScenario } from '../performance/types';
import { TodoSimulator } from './todo-simulator';

export const customScenarios: CustomTestScenario[] = [
  {
    id: 'toggleTodo',
    name: 'Toggle Todo',
    description: 'Toggles the completion status of a random todo item',
    run: async (simulator: TodoSimulator) => {
      await simulator.simulateToggleTodo();
    },
  },
  {
    id: 'deleteTodo',
    name: 'Delete Todo',
    description: 'Deletes a random todo item from the list',
    run: async (simulator: TodoSimulator) => {
      await simulator.simulateDeleteTodo();
    },
  },
  {
    id: 'editInput',
    name: 'Edit Input',
    description: 'Simulates editing the todo input field',
    run: async (simulator: TodoSimulator) => {
      await simulator.simulateEditInput();
    },
  },
];
