require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('../db/db.config');

const authRoutes = require('../routes/login');
const userRoutes = require('../routes/employee');
const dashboardRoutes = require('../routes/dashboard');
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
app.use('/api', userRoutes);
app.use('/api', dashboardRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

