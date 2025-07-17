const express = require('express');
const router = express.Router();
const { User } = require('../models/table');
const { Op } = require('sequelize');

router.get('/user-count', async (req, res) => {
  try {
    const active = await User.count({ where: { roleName: 'USER', status: 'active' } });
    const blocked = await User.count({ where: { roleName: 'USER', status: { [Op.ne]: 'active' } } });
    const total = await User.count({ where: { roleName: 'USER' } });

    res.json({ code: '0000', active, blocked, total });
  } catch (error) {
    res.status(500).json({ code: '9999', message: 'Failed to get user count' });
  }
});

module.exports = router;

