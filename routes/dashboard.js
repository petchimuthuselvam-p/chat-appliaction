const express = require('express');
const router = express.Router();
const { Employee } = require('../models/table');
const { Op } = require('sequelize');

router.get('/user-count', async (req, res) => {
  try {
    const active = await Employee.count({ where: { status: 'active' } });
    const blocked = await Employee.count({ where: { status: { [Op.ne]: 'active' } } });
    const total = await Employee.count();

    res.json({
      code: '0000',
      active,
      blocked,
      total
    });
  } catch (error) {
    console.error('Failed to get user count:', error);
    res.status(500).json({ code: '9999', message: 'Failed to get user count' });
  }
});

module.exports = router;
