const { calculatePriority } = require('../utils/priorityCalculator');

describe('Priority Calculator', () => {
  test('should return low priority for completed tasks', () => {
    const task = {
      title: 'Test Task',
      isCompleted: true,
      isCritical: false,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) // 2 days from now
    };
    expect(calculatePriority(task)).toBe('low');
  });

  test('should return high priority for critical tasks', () => {
    const task = {
      title: 'Test Task',
      isCompleted: false,
      isCritical: true,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10) // 10 days from now
    };
    expect(calculatePriority(task)).toBe('high');
  });

  test('should return high priority for tasks due within 3 days', () => {
    const task = {
      title: 'Test Task',
      isCompleted: false,
      isCritical: false,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) // 2 days from now
    };
    expect(calculatePriority(task)).toBe('high');
  });

  test('should return medium priority for tasks due within 7 days', () => {
    const task = {
      title: 'Test Task',
      isCompleted: false,
      isCritical: false,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5) // 5 days from now
    };
    expect(calculatePriority(task)).toBe('medium');
  });

  test('should return medium priority for tasks with no due date', () => {
    const task = {
      title: 'Test Task',
      isCompleted: false,
      isCritical: false
    };
    expect(calculatePriority(task)).toBe('medium');
  });
});