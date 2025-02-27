const taskController = require('../controllers/taskController');
const { calculatePriority } = require('../utils/priorityCalculator');

// Mock modules
jest.mock('../models', () => ({
  Task: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn()
  }
}));

jest.mock('../utils/priorityCalculator', () => ({
  calculatePriority: jest.fn()
}));

jest.mock('../config/database', () => ({
  sequelize: {
    literal: jest.fn().mockReturnValue('MOCKED_LITERAL_QUERY')
  }
}));

// Importing mocked modules
const { Task } = require('../models');
const { sequelize } = require('../config/database');

describe('Task Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express request and response
    req = {
      body: {},
      params: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });

  describe('createTask', () => {
    test('should return 400 if title is missing', async () => {
      req.body = {
        description: 'Test Description',
        dueDate: '2023-12-31'
      };

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Title is required' });
      expect(Task.create).not.toHaveBeenCalled();
    });

    test('should create a task successfully', async () => {
      req.body = {
        title: 'Test Task',
        description: 'Test Description',
        dueDate: '2023-12-31',
        isCritical: true
      };

      calculatePriority.mockReturnValue('high');

      const mockTask = {
        id: '123',
        ...req.body,
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      Task.create.mockResolvedValue(mockTask);

      await taskController.createTask(req, res);

      expect(calculatePriority).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Task',
        isCritical: true
      }));
      expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Task',
        priority: 'high'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    test('should handle errors during task creation', async () => {
      req.body = {
        title: 'Test Task'
      };

      const mockError = new Error('Database error');
      Task.create.mockRejectedValue(mockError);

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create task',
        error: 'Database error'
      });
    });
  });

  describe('getTasks', () => {
    test('should get all tasks with default sorting', async () => {
      req.query = {};

      const mockTasks = [
        { id: '1', title: 'Task 1', priority: 'high' },
        { id: '2', title: 'Task 2', priority: 'medium' }
      ];
      Task.findAll.mockResolvedValue(mockTasks);

      await taskController.getTasks(req, res);

      expect(sequelize.literal).toHaveBeenCalled();
      expect(Task.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
        order: expect.any(Array)
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    test('should filter tasks by completion status', async () => {
      req.query = {
        filter: 'isCompleted',
        value: 'true'
      };

      const mockTasks = [
        { id: '1', title: 'Completed Task', isCompleted: true }
      ];
      Task.findAll.mockResolvedValue(mockTasks);

      await taskController.getTasks(req, res);

      expect(Task.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isCompleted: true },
        order: expect.any(Array)
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    test('should filter tasks by priority', async () => {
      req.query = {
        filter: 'priority',
        value: 'high'
      };

      const mockTasks = [
        { id: '1', title: 'High Priority Task', priority: 'high' }
      ];
      Task.findAll.mockResolvedValue(mockTasks);

      await taskController.getTasks(req, res);

      expect(Task.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { priority: 'high' },
        order: expect.any(Array)
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    test('should sort tasks by due date', async () => {
      req.query = {
        sort: 'dueDate'
      };

      const mockTasks = [
        { id: '1', title: 'Soon Task', dueDate: '2023-12-01' },
        { id: '2', title: 'Later Task', dueDate: '2023-12-31' }
      ];
      Task.findAll.mockResolvedValue(mockTasks);

      await taskController.getTasks(req, res);

      expect(Task.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
        order: [['dueDate', 'ASC']]
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    test('should handle errors during task retrieval', async () => {
      req.query = {};

      const mockError = new Error('Database error');
      Task.findAll.mockRejectedValue(mockError);

      await taskController.getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to get tasks',
        error: 'Database error'
      });
    });
  });

  describe('getTaskById', () => {
    test('should return 404 if task not found', async () => {
      req.params = { id: '123' };

      Task.findByPk.mockResolvedValue(null);

      await taskController.getTaskById(req, res);

      expect(Task.findByPk).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
    });

    test('should return task if found', async () => {
      req.params = { id: '123' };

      const mockTask = {
        id: '123',
        title: 'Test Task',
        priority: 'high'
      };
      Task.findByPk.mockResolvedValue(mockTask);

      await taskController.getTaskById(req, res);

      expect(Task.findByPk).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    test('should handle errors during task lookup', async () => {
      req.params = { id: '123' };

      const mockError = new Error('Database error');
      Task.findByPk.mockRejectedValue(mockError);

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to get task',
        error: 'Database error'
      });
    });
  });

  describe('updateTask', () => {
    test('should return 404 if task not found', async () => {
      req.params = { id: '123' };
      req.body = {
        title: 'Updated Title'
      };

      Task.findByPk.mockResolvedValue(null);

      await taskController.updateTask(req, res);

      expect(Task.findByPk).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
    });

    test('should update task properties and recalculate priority', async () => {
      req.params = { id: '123' };
      req.body = {
        title: 'Updated Title',
        isCompleted: true
      };

      const mockTask = {
        id: '123',
        title: 'Original Title',
        isCompleted: false,
        priority: 'high',
        save: jest.fn().mockResolvedValue(true)
      };
      Task.findByPk.mockResolvedValue(mockTask);

      calculatePriority.mockReturnValue('low');

      await taskController.updateTask(req, res);

      expect(Task.findByPk).toHaveBeenCalledWith('123');
      expect(mockTask.title).toBe('Updated Title');
      expect(mockTask.isCompleted).toBe(true);
      expect(calculatePriority).toHaveBeenCalledWith(mockTask);
      expect(mockTask.priority).toBe('low');
      expect(mockTask.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    test('should handle errors during task update', async () => {
      req.params = { id: '123' };
      req.body = {
        title: 'Updated Title'
      };

      const mockError = new Error('Database error');
      Task.findByPk.mockRejectedValue(mockError);

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to update task',
        error: 'Database error'
      });
    });
  });

  describe('deleteTask', () => {
    test('should return 404 if task not found', async () => {
      req.params = { id: '123' };

      Task.findByPk.mockResolvedValue(null);

      await taskController.deleteTask(req, res);

      expect(Task.findByPk).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
    });

    test('should delete task if found', async () => {
      req.params = { id: '123' };

      const mockTask = {
        id: '123',
        title: 'Test Task',
        destroy: jest.fn().mockResolvedValue(true)
      };
      Task.findByPk.mockResolvedValue(mockTask);

      await taskController.deleteTask(req, res);

      expect(Task.findByPk).toHaveBeenCalledWith('123');
      expect(mockTask.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    test('should handle errors during task deletion', async () => {
      req.params = { id: '123' };

      const mockError = new Error('Database error');
      Task.findByPk.mockRejectedValue(mockError);

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to delete task',
        error: 'Database error'
      });
    });
  });
});