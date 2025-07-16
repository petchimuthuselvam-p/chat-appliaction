const express = require('express');
const router = express.Router();
const { Employee } = require('../models/table');
const authenticateToken = require('../middlewares/auth.middleware');

router.post('/save', async (req, res) => {
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

    res.json({
      code: "0000",
      message: "Registered",
      data: {
        id: employee.id,
        user_name: employee.user_name,
        email: employee.email,
        phone_no: employee.phone_no,
        dob: employee.dob
      },
    });
  } catch (e) {
    console.error('Error while saving employee:', e);
    res.json({ code: "9999", message: "Error" });
  }
});


router.get('/get-all', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 5;
    const offset = (page - 1) * size;

    const { count, rows } = await Employee.findAndCountAll({
      attributes: ['id', 'user_name', 'email', 'phone_no', 'dob', 'status'],
      offset,
      limit: size
    });

    res.json({ total: count, data: rows, page, size });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
});


router.put('/toggle-status/:id', authenticateToken, async (req, res) => {
  try {
    const user = await Employee.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    await user.update({ status: newStatus });

    res.json({ message: `User status changed to ${newStatus}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error toggling status' });
  }
});


router.put('/update/:id', authenticateToken, async (req, res) => {
  const { userName, dob, email, phoneNo } = req.body;

  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ code: "9999", message: "User not found" });
    }

    await employee.update({ user_name: userName, dob, email, phone_no: phoneNo });

    res.json({ code: "0000", message: "Employee updated successfully" });
  } catch (e) {
    console.error('Error updating employee:', e);
    res.status(500).json({ code: "9999", message: "Update failed" });
  }
});

router.get('/get-active', authenticateToken, async (req, res) => {
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

module.exports = router;
