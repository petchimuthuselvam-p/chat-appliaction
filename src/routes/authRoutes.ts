import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendPasscodeEmail } from '../kafka/emailProducer'




const router = express.Router();


router.post('/register', async (req, res) => {
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

router.post('/verify', async (req, res) => {
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

  res.status(200).json({ token, statusCode: 200 }); // statusCode added here
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('email',email)
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: 'User not found' });
  user.verified = true;
  await user.save();
console.log('User found:', user);
  if (!user || !user.verified) return res.status(400).json({ msg: 'Invalid or unverified' });

  const isMatch = await bcrypt.compare(password,user?.password);
  if (!isMatch) return res.status(400).json({ msg: 'Wrong password' });

  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!);
  res.json({ token });
});

router.get('/userlist', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error });
  }
});



export default router;
