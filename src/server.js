const app = require('./app');
require('dotenv').config();

console.log("process.env.PORT", process.env.PORT);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});