import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendPasscodeEmail } from '../kafka/emailProducer';
import Message from '../models/Message';
import { io } from '../index';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import mongoose from 'mongoose';


const app = express();

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
const router = express.Router();
// Upload folder path
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req: express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Accept all files, add type check if needed
    cb(null, true);
  },
});


router.post('/send-file', upload.single('file'), async (req: Request, res: Response) => {
  const { from, to } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const message = await Message.create({
      from,
      to,
      filePath: req.file.filename,
      type: 'private',
    });

    io.emit('chat-message', {
      from,
      to,
      filePath: req.file.filename,
    });

    return res.status(200).json({ message});
  } catch (err) {
    console.error('Error saving file message:', err);
    res.status(500).json({ message: 'Error saving file message' });
  }
});


// ✅ Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, mobile, dob, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({ username, email, mobile, dob, password: hashed, passcode });
    const result = await user.save();

    await sendPasscodeEmail({ email, passcode });

    res.json({
      success: true,
      statusCode: 200,
      msg: 'User registered successfully. Please check your email for the verification passcode.',
      data: result,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ Verify
router.post('/verify', async (req: Request, res: Response) => {
  const { email, passcode } = req.body;

  if (!email || !passcode) {
    return res.status(400).json({ msg: 'Email and passcode are required' });
  }

  const user = await User.findOne({ email, passcode });

  if (!user) {
    return res.status(400).json({ msg: 'Invalid passcode' });
  }

  user.verified = true;
  await user.save();

  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!);

  res.status(200).json({ token, statusCode: 200 });
});

// ✅ Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: 'User not found' });

  if (!user.verified) return res.status(400).json({ msg: 'User not verified' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: 'Wrong password' });

  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!);

  res.json({ token, user });
});

// ✅ User list
router.get('/userlist', async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error });
  }
});

// ✅ Send message
router.post('/send-msg', async (req: Request, res: Response) => {
  const { from, message, to } = req.body;

  if (!from || !message) {
    return res.status(400).json({ msg: 'Missing fields' });
  }

  try {
    await Message.create({ from, message, to });

    io.emit('chat-message', { from, message });
    res.status(200).json({ msg: 'Message sent' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/messages/:id/:selectedUserId', async (req: Request, res: Response) => {
  const { id, selectedUserId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(selectedUserId)) {
    return res.status(400).json({ msg: 'Invalid user ID' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { $and: [{ from: id }, { to: selectedUserId }] },
        { $and: [{ from: selectedUserId }, { to: id }] },
      ],
    }).sort({ createdAt: -1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return res.status(500).json({ msg: 'Server error while fetching messages' });
  }
});

// ✅ Get user by ID
router.get('/user-id/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ data: userDetails });
  } catch (error) {
    console.error('Error retrieving user ID:', error);
    return res.status(500).json({ msg: 'Server error while fetching user ID' });
  }
});

export default router;
