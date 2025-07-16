const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/table');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ code: "9999", message: "Missing fields" });

  try {
    const user = await User.findOne({ where: { email, password } });
    if (!user) return res.json({ code: "9999", message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, userName: user.user_name },
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({ code: "0000", message: "Login successful", token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ code: "9999", message: "Error during login" });
  }
});

module.exports = router;
