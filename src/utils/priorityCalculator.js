const calculatePriority = (task) => {
    if (task.isCompleted) {
      return 'low';
    }
    
    if (task.isCritical) {
      return 'high';
    }
    
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const currentDate = new Date();
      const daysDifference = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24)); // Formula for calculating the days. dueDate - currentDate result is in milliseconds -> 86,400,000 milliseconds in one day
      
      if (daysDifference <= 3) {
        return 'high';
      } else if (daysDifference <= 7) {
        return 'medium';
      }
    }
    
    return 'medium';
  };
  
  module.exports = { calculatePriority };