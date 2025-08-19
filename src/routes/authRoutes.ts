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
import GroupSchema from '../models/GroupSchema';
import { GroupMessage } from '../models/groupMessage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
const router = express.Router();

dotenv.config();

const apiKey: string | undefined = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is missing from environment variables.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function sendToOllama(message: string): Promise<string> {
  const MAX_RETRIES = 3;
  const OLLAMA_URL = 'http://localhost:11434/api/generate';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[DEBUG] Attempting to send to Ollama (attempt ${attempt + 1}/${MAX_RETRIES})`);

      const response = await axios.post(OLLAMA_URL, {
        model: 'gemma3:1b',
        prompt: message,
        stream: false
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.response) {
        console.log('[DEBUG] Successfully received response from Ollama');
        return response.data.response.trim();
      } else {
        throw new Error('Invalid response format from Ollama');
      }

    } catch (error: any) {
      const isLastAttempt = attempt === MAX_RETRIES - 1;

      if (error.code === 'ECONNREFUSED') {
        console.error(`❌ Ollama connection refused on attempt ${attempt + 1}`);
        if (isLastAttempt) {
          throw new Error('Ollama service is not running. Please start Ollama and try again.');
        }
      } else if (error.code === 'ENOTFOUND') {
        console.error(`❌ Ollama host not found on attempt ${attempt + 1}`);
        if (isLastAttempt) {
          throw new Error('Ollama host not found. Please check your Ollama configuration.');
        }
      } else if (error.code === 'ETIMEDOUT') {
        console.error(`❌ Ollama request timeout on attempt ${attempt + 1}`);
        if (isLastAttempt) {
          throw new Error('Ollama request timed out. Please try again.');
        }
      } else {
        console.error(`❌ Ollama error on attempt ${attempt + 1}:`, error.message);
        if (isLastAttempt) {
          throw new Error(`Ollama error: ${error.message}`);
        }
      }

      // Wait before retrying (exponential backoff)
      if (!isLastAttempt) {
        const waitTime = 1000 * Math.pow(2, attempt);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error("Failed to get response from Ollama after all retries");
}

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, _file, cb: FileFilterCallback) => cb(null, true),
});

router.post('/send-file', upload.single('file'), async (req: Request, res: Response) => {
  const { from, to } = req.body;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const message = await Message.create({ from, to, filePath: req.file.filename, type: 'private' });
    io.emit('chat-message', { from, to, filePath: req.file.filename });
    return res.status(200).json({ message });
  } catch (err) {
    console.error('Error saving file message:', err);
    res.status(500).json({ message: 'Error saving file message' });
  }
});

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

    res.json({ success: true, statusCode: 200, msg: 'User registered successfully.', data: result });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  const { email, passcode } = req.body;
  if (!email || !passcode) return res.status(400).json({ msg: 'Email and passcode are required' });
  const user = await User.findOne({ email, passcode });
  if (!user) return res.status(400).json({ msg: 'Invalid passcode' });
  user.verified = true;
  await user.save();
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!);
  res.status(200).json({ token, statusCode: 200 });
});

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

router.get('/userlist', async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error });
  }
});

router.post('/send-msg', async (req: Request, res: Response) => {
  const { from, message, to } = req.body;
  if (!from || !message) return res.status(400).json({ msg: 'Missing fields' });
  try {
    await Message.create({ from, message, to });
    io.emit('chat-message', { from, message });
    res.status(200).json({ msg: 'Message sent' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/guest-send-msg', async (req: Request, res: Response) => {
  const { from, message, to } = req.body;
  console.log('[DEBUG] Incoming guest message:', { from, message, to });

  if (typeof from !== 'string' || typeof message !== 'string' || !from.trim() || !message.trim()) {
    console.warn('[WARN] Invalid input:', { from, message });
    return res.status(400).json({ msg: 'Missing or invalid "from" or "message" fields' });
  }

  try {
    // Save user message to database first
    const userMessage = await Message.create({
      from: from,
      message: message.trim(),
      to: 'AutoBot'
    });

    console.log('[DEBUG] User message saved to DB:', userMessage);

    // Emit the user message confirmation immediately with proper room targeting
    io.to(from).emit('guest-message', {
      from: from,
      message: message.trim(),
      timestamp: Date.now()
    });

    // Also emit to all clients for debugging (remove if not needed)
    io.emit('guest-message', {
      from: from,
      message: message.trim(),
      timestamp: Date.now()
    });

    // Send bot typing indicator to the specific room
    console.log('[DEBUG] Sending bot-typing indicator to room:', from);
    io.to(from).emit('bot-typing', {
      from: 'AutoBot',
      to: from,
      timestamp: Date.now()
    });

    // Also emit globally for fallback
    io.emit('bot-typing', {
      from: 'AutoBot',
      to: from,
      timestamp: Date.now()
    });

    // Get bot response from Ollama
    let botReply;
    try {
      // Show typing for at least 2 seconds for better UX
      const [ollamaResponse] = await Promise.all([
        sendToOllama(message),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      botReply = ollamaResponse;
    } catch (ollamaError) {
      console.error('[ERROR] Ollama failed:', ollamaError);
      // Fallback response when Ollama is unavailable
      botReply = "I'm sorry, I'm currently unavailable. Please try again later.";
    }

    // Save bot response to database
    const botMessage = await Message.create({
      from: 'AutoBot',
      message: botReply,
      to: from
    });

    console.log('[DEBUG] Bot message saved to DB:', botMessage);

    // Send streaming chunks for better UX (simulated typing effect)
    if (botReply && botReply.length > 20) {
      const words = botReply.split(' ');
      const chunkSize = Math.max(1, Math.ceil(words.length / 8)); // Smaller chunks for more realistic typing

      let accumulatedText = '';
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
        accumulatedText += chunk;
        
        // Emit to specific room
        io.to(from).emit('bot-stream', {
          chunk: chunk,
          accumulatedText: accumulatedText.trim(),
          timestamp: Date.now()
        });
        
        // Also emit globally for fallback
        io.emit('bot-stream', {
          chunk: chunk,
          accumulatedText: accumulatedText.trim(),
          timestamp: Date.now(),
          roomId: from
        });
        
        // Variable delay based on chunk length for realistic typing
        const delay = Math.min(200, Math.max(100, chunk.length * 20));
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Send completion signal with final message
    io.to(from).emit('bot-complete', {
      from: 'AutoBot',
      message: botReply,
      timestamp: Date.now()
    });

    // Global emit for fallback
    io.emit('bot-complete', {
      from: 'AutoBot',
      message: botReply,
      timestamp: Date.now(),
      roomId: from
    });

    // Final guest-message emit for consistency
    io.to(from).emit('guest-message', {
      from: 'AutoBot',
      message: botReply,
      timestamp: Date.now()
    });

    // Global emit for fallback
    io.emit('guest-message', {
      from: 'AutoBot',
      message: botReply,
      timestamp: Date.now()
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        userMessage,
        botMessage
      }
    });

  } catch (error: any) {
    console.error('[ERROR] Failed to process guest message:', error);

    // Send error message to user
    const errorResponse = "Sorry, I encountered an error processing your message. Please try again.";
    
    io.to(from).emit('guest-message', {
      from: 'AutoBot',
      message: errorResponse,
      timestamp: Date.now()
    });

    io.emit('guest-message', {
      from: 'AutoBot',
      message: errorResponse,
      timestamp: Date.now()
    });

    return res.status(500).json({
      msg: 'Failed to process message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    return res.status(500).json({ msg: 'Server error while fetching messages' });
  }
});

router.get('/guest-messages/:id/:selectedUserId', async (req: Request, res: Response) => {
  const { id, selectedUserId } = req.params;
  console.log('[DEBUG] Fetching guest messages for:', { id, selectedUserId });

  try {
    const messages = await Message.find({
      $or: [
        { $and: [{ from: id }, { to: selectedUserId }] },
        { $and: [{ from: selectedUserId }, { to: id }] },
      ],
    }).sort({ createdAt: 1 }); // Sort ascending for proper chronological order

    console.log('[DEBUG] Found messages:', messages.length);
    return res.status(200).json(messages);
  } catch (error) {
    console.error('[ERROR] Failed to fetch guest messages:', error);
    return res.status(500).json({ msg: 'Server error while fetching messages' });
  }
});

router.get('/user-id/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userDetails = await User.findById(id);
    if (!userDetails) return res.status(404).json({ msg: 'User not found' });
    res.json({ data: userDetails });
  } catch (error) {
    return res.status(500).json({ msg: 'Server error while fetching user ID' });
  }
});

router.post('/create-group', async (req: Request, res: Response) => {
  const { groupName, userId, adminId } = req.body;
  if (!groupName || !userId || !adminId) {
    return res.status(400).json({ msg: 'Missing fields' });
  }

  try {
    const group = new GroupSchema({ groupName, userId, adminId });
    const savedGroup = await group.save();
    res.status(201).json({ msg: 'Group created successfully', data: savedGroup });
  } catch (error) {
    res.status(500).json({ msg: 'Server error while creating group' });
  }
});

router.get('/group-user/:adminId', async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const groupUsers = await GroupSchema.find({ userId: adminId });
    res.status(200).json(groupUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/grp-send-msg', async (req: Request, res: Response) => {
  const { groupId, sender, message } = req.body;
  if (!message) return res.status(400).json({ msg: 'Missing fields' });

  try {
    await GroupMessage.create({ groupId, sender, message });
    io.emit('chat-message', { sender, message });
    res.status(200).json({ msg: 'Message sent' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/group-messages/:groupId', async (req: Request, res: Response) => {
  const { groupId } = req.params;
  try {
    const messages = await GroupMessage.find({ groupId }).sort({ createdAt: -1 });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ msg: 'Server error while fetching messages' });
  }
});

export default router; 