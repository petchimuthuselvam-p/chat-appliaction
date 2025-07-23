import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Admin } from '../models/table';

const router = express.Router();

// Admin Login
router.post('/login', async (req: Request, res: Response) => {
  const { adminEmail, password } = req.body;

  if (!adminEmail || !password) {
    return res.status(400).json({ code: "9999", message: "Missing email or password" });
  }

  try {
    const admin = await Admin.findOne({ where: { adminEmail } });

    if (!admin) {
      return res.status(401).json({ code: "9999", message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password.trim(), admin.password);

    if (!isMatch) {
      return res.status(401).json({ code: "9999", message: "Invalid email or password" });
    }

    return res.status(200).json({
      code: "0000",
      message: "Login successful",
      data: {
        adminId: admin.adminId,
        adminEmail: admin.adminEmail,
        roleName: admin.roleName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ code: "9999", message: "Internal server error" });
  }
});


export default router;
