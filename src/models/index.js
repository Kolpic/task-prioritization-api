const { sequelize } = require('../config/database');
const Task = require('./task');

const initializeModels = async () => {
  await sequelize.sync({ alter: true });
  console.log('Models synchronized with database');
};

module.exports = {
  Task,
  initializeModels
};