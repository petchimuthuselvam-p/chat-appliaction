require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('../db/db.config');
const authRoutes = require('../routes/login');
const employeeRoutes = require('../routes/employee');
const userCountRoutes = require('../routes/dashboard');


const app = express();
const PORT = process.env.PORT || 8080;

(async () => {
  try {
    await sequelize.sync();
    console.log('✅ Database synced');
  } catch (error) {
    console.error('❌ Database sync failed:', error);
  }
})();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', authRoutes);
app.use('/api', employeeRoutes);
app.use('/api', userCountRoutes); 

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
