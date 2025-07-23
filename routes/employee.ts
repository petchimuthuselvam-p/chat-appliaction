import express, { Request, Response } from 'express';
import { User, Admin } from '../models/table';
import authenticateToken from '../middlewares/auth.middleware';
import { Op } from 'sequelize';
import { sendRegistrationMail } from '../mailsend/mailer';
import bcrypt from 'bcrypt';

const router = express.Router();

// Save User
router.post('/save-user', async (req: Request, res: Response) => {
  const { userName, email, password, phoneNo, dob, roleName } = req.body;

  if (!userName || !email || !dob || !phoneNo) {
    return res.json({ code: "9999", message: "Missing required fields" });
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

    await sendRegistrationMail(email, userName);
    res.json({ code: "0000", message: "User created", data: newUser });
  } catch (e) {
    console.error('User creation error:', e);
    res.json({ code: "9999", message: "Error creating user" });
  }
});

// Get All Users
router.get('/get-users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 5;
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

// Toggle Status
router.put('/toggle-status/:id', authenticateToken, async (req: Request, res: Response) => {
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

// Update User
router.put('/update-user/:id', authenticateToken, async (req: Request, res: Response) => {
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

// Delete User
router.delete('/delete-user/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, roleName: 'USER' } });
    if (!user) {
      return res.status(404).json({ code: "9999", message: "User not found" });
    }

    await user.destroy();
    res.json({ code: "0000", message: "User deleted successfully" });
  } catch (e) {
    console.error('Error deleting user:', e);
    res.status(500).json({ code: "9999", message: "Failed to delete user" });
  }
});

// Get Active Users
router.get('/active-users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 5;
    const offset = (page - 1) * size;

    const { count, rows } = await User.findAndCountAll({
      where: {
        roleName: 'USER',
        status: 'active'
      },
      attributes: ['id', 'user_name', 'email', 'phone_no', 'dob', 'status'],
      offset,
      limit: size
    });

    res.json({ total: count, data: rows, page, size });
  } catch (e) {
    console.error('Error fetching active users:', e);
    res.status(500).json({ code: "9999", message: 'Failed to fetch active users' });
  }
});

// Register Admin
// Register Admin
router.post('/register-admin', async (req: Request, res: Response) => {
  try {
    const { adminId, adminName, adminEmail, password, roleName } = req.body;

    if (!adminEmail || !password || !adminName || !roleName) {
      return res.status(400).json({ code: "9999", message: "Missing required fields" });
    }

    const existingAdmin = await Admin.findOne({ where: { adminEmail } });
    if (existingAdmin) {
      return res.status(409).json({ code: "9999", message: "Email already registered" });
    }

    const newAdmin = await Admin.create({
      adminId,
      adminName,
      adminEmail: adminEmail.trim(),
      password: password.trim(), // ✅ No hashing here!
      roleName,
    });

    res.status(200).json({
      code: "0000",
      message: "Admin registered successfully",
      data: {
        adminId: newAdmin.adminId,
        adminEmail: newAdmin.adminEmail,
        roleName: newAdmin.roleName
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ code: "9999", message: "Error registering admin" });
  }
});


export default router;
