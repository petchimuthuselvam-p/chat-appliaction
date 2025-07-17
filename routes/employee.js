const express = require('express');
const router = express.Router();
const { User } = require('../models/table');
const authenticateToken = require('../middlewares/auth.middleware');
const { Op } = require('sequelize');


router.post('/save-user', async (req, res) => {
    const { userName, email, password, phoneNo, dob, roleName } = req.body;
    if (!userName || !email || !dob || !phoneNo) {
        return res.json({ code: "9999", message: "Missing required fields: userName, email, dob, phoneNo" });
    }
    try {
        const newUser = await User.create({
            user_name: userName,
            email,
            password: password || null,
            phone_no: phoneNo,
            dob,
            roleName: roleName || 'USER'
        });

        res.json({ code: "0000", message: "User created", data: newUser });
    } catch (e) {
        console.error('User creation error:', e);
        res.json({ code: "9999", message: "Error creating user" });
    }
});


router.get('/get-users', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 5;
        const offset = (page - 1) * size;

        const { count, rows } = await User.findAndCountAll({
            where: { roleName: 'USER' },
            attributes: ['id', 'user_name', 'email', 'phone_no', 'dob', 'status'],
            offset,
            limit: size
        });

        res.json({ total: count, data: rows, page, size });
    } catch (e) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

router.put('/toggle-status/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.params.id, roleName: 'USER' } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        await user.update({ status: newStatus });

        res.json({ message: `User is ${newStatus}` });
    } catch (e) {
        res.status(500).json({ message: 'Error toggling status' });
    }
});

router.put('/update-user/:id', authenticateToken, async (req, res) => {
    const { userName, dob, email, phoneNo } = req.body;

    try {
        const user = await User.findOne({ where: { id: req.params.id, roleName: 'USER' } });
        if (!user) return res.status(404).json({ code: "9999", message: "User not found" });

        await user.update({ user_name: userName, dob, email, phone_no: phoneNo });

        res.json({ code: "0000", message: "User updated successfully" });
    } catch (e) {
        res.status(500).json({ code: "9999", message: "Update failed" });
    }
});

module.exports = router;


