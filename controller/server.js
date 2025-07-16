require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Employee, User } = require('../models/Employee');
const authRoutes = require('../routes/auth');
const sequelize = require('../db/db.config');


const app = express();
const PORT = 8080;
const SECRET_KEY = 'secret123';

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

// middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Employee APIs
app.post('/api/save-employee', async (req, res) => {
  const { userName, email, phoneNo, dob } = req.body;
  if (!userName || !email || !phoneNo || !dob) {
    return res.json({ code: "9999", message: "Missing fields" });
  }

  try {
    const employee = await Employee.create({
      user_name: userName,
      email,
      phone_no: phoneNo,
      dob
    });

    const responseMessage = {
      code: "0000",
      message: "Registered",
      data: {
        id: employee.id,
        user_name: employee.user_name,
        email: employee.email,
        phone_no: employee.phone_no,
        dob: employee.dob
      },
    };

    await sendMessage('employee-topic', responseMessage);
    await sendRegistrationMail(email, userName);

    res.json(responseMessage);
  } catch (e) {
    console.error('Error while saving employee:', e);
    res.json({ code: "9999", message: "Error" });
  }
});

app.get('/api/get-all', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 5;
    const offset = (page - 1) * size;

    const { count, rows } = await Employee.findAndCountAll({
      attributes: ['id', 'user_name', 'email', 'phone_no', 'dob', 'status'],
      offset,
      limit: size
    });

    res.json({
      total: count,
      data: rows,
      page,
      size
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
});

app.put('/api/toggle-status/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await Employee.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    await user.update({ status: newStatus });

    res.json({ message: `User status changed to ${newStatus}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error toggling status' });
  }
});

app.put('/api/update-employee/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  const { userName, dob, email, phoneNo } = req.body;

  try {
    const employee = await Employee.findByPk(userId);
    if (!employee) {
      return res.status(404).json({ code: "9999", message: "User not found" });
    }

    await employee.update({
      user_name: userName,
      dob,
      email,
      phone_no: phoneNo
    });

    res.json({ code: "0000", message: "Employee updated successfully" });
  } catch (e) {
    console.error('Error updating employee:', e);
    res.status(500).json({ code: "9999", message: "Update failed" });
  }
});

app.get('/api/get-active', authenticateToken, async (req, res) => {
  try {
    const activeUsers = await Employee.findAll({
      where: { status: 'active' },
      attributes: ['id', 'user_name', 'email', 'phone_no', 'dob', 'status']
    });
    res.json(activeUsers);
  } catch (e) {
    console.error('Error fetching active employees:', e);
    res.status(500).json({ message: 'Failed to fetch active employees' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
