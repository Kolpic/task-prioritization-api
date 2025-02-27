const { Task } = require('../models');
const { calculatePriority } = require('../utils/priorityCalculator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database'); 

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, isCritical } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const taskData = { title, description, dueDate, isCritical: !!isCritical };
    taskData.priority = calculatePriority(taskData);
    
    const task = await Task.create(taskData);
    return res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { sort, filter, value } = req.query;
    
    const queryOptions = { where: {} };
    
    if (filter && value !== undefined) {
      const filterOptions = {
        isCompleted: () => ({ isCompleted: value === 'true' }),
        priority: () => ({ priority: value })
      };
      
      if (filterOptions[filter]) {
        queryOptions.where = filterOptions[filter]();
      }
    }
    
    // SQL expression that maps text priority values to numeric values for sorting
    const priorityOrder = [
      [sequelize.literal("CASE WHEN priority = 'high' THEN 1 WHEN priority = 'medium' THEN 2 WHEN priority = 'low' THEN 3 END"), 'ASC']
    ];
    
    const sortOptions = {
      dueDate: [['dueDate', 'ASC']],
      priority: priorityOrder,
      default: priorityOrder
    };
    
    queryOptions.order = sortOptions[sort] || sortOptions.default;
    
    const tasks = await Task.findAll(queryOptions);
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    return res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    return res.status(200).json(task);
  } catch (error) {
    console.error('Error getting task:', error);
    return res.status(500).json({ message: 'Failed to get task', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, isCompleted, isCritical } = req.body;
    
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (isCompleted !== undefined) task.isCompleted = isCompleted;
    if (isCritical !== undefined) task.isCritical = isCritical;
    
    task.priority = calculatePriority(task);
    
    await task.save();
    return res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await task.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};