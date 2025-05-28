import type { TestScenario, CustomTestScenario } from '@/lib/performance/types';
import { customScenarios } from './scenarios';

export class TodoSimulator {
  private defaultTodoText: string;
  private currentTest: number = 1;

  constructor(defaultTodoText: string) {
    this.defaultTodoText = defaultTodoText;
  }

  public setCurrentTest(testNumber: number): void {
    this.currentTest = testNumber;
  }

  public simulateAddTodo(): void {
    // Query the DOM for the input and button
    const inputEl = document.querySelector('[data-testid="todo-input"]') as HTMLInputElement;
    const addTodoButton = document.querySelector('[data-testid="add-todo-button"]') as HTMLButtonElement;

    if (!inputEl || !addTodoButton) return;

    // Use currentTest for todo IDs
    const todoId = this.currentTest;

    // Set input value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(inputEl, `${this.defaultTodoText} #${todoId}`);
    }

    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    inputEl.dispatchEvent(inputEvent);

    // Click the add button
    addTodoButton.click();
  }

  public simulateToggleTodo(): void {
    // Query the DOM for all todo checkboxes
    const checkboxes = Array.from(document.querySelectorAll('[data-testid*="todo-toggle"]')) as HTMLInputElement[];

    if (!checkboxes.length) {
      // If no checkboxes found in DOM (shouldn't happen after adding one)
      this.simulateAddTodo();
      return;
    }

    const randomIndex = Math.floor(Math.random() * checkboxes.length);
    const checkbox = checkboxes[randomIndex];

    // Toggle the checkbox
    if (checkbox) {
      checkbox.click();
    }
  }

  public simulateDeleteTodo(): void {
    // Query the DOM for all delete buttons to get the latest list
    const deleteButtons = Array.from(document.querySelectorAll('[data-testid*="todo-delete"]')) as HTMLButtonElement[];

    if (!deleteButtons.length) {
      // If no delete buttons found, add a todo first (or if the list is empty after deletion)
      this.simulateAddTodo();
      return;
    }

    // Get the last delete button from the current DOM
    const deleteButton = deleteButtons[deleteButtons.length - 1];

    // Click the delete button
    if (deleteButton) {
      deleteButton.click();
    }
  }

  public simulateEditInput(): void {
    // Query the DOM for the input element
    const inputEl = document.querySelector('[data-testid="todo-input"]') as HTMLInputElement;

    if (!inputEl) return;

    // Set input value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(inputEl, `${this.defaultTodoText} #${Math.random().toString(36).substring(7)}`);
    }

    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    inputEl.dispatchEvent(inputEvent);
  }

  async performInteraction(scenario: TestScenario | CustomTestScenario) {
    if (typeof scenario === 'string') {
      // Find the predefined scenario
      const customScenario = customScenarios.find(s => s.id === scenario);
      if (!customScenario) {
        throw new Error(`Unknown scenario: ${scenario}`);
      }
      await customScenario.run(this);
    } else {
      await scenario.run(this);
    }
  }

  public setTodoText(todoText: string): void {
    this.defaultTodoText = todoText;
  }

  public getTodoCount(): number {
    // Get all checkboxes which represent todos
    const checkboxes = Array.from(document.querySelectorAll('[data-testid*="todo-toggle"]'));
    return checkboxes.length;
  }
}
