"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const emailProducer_1 = require("../kafka/emailProducer");
const Message_1 = __importDefault(require("../models/Message"));
const index_1 = require("../index");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const GroupSchema_1 = __importDefault(require("../models/GroupSchema"));
const groupMessage_1 = require("../models/groupMessage");
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing from environment variables.");
    process.exit(1);
}
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
function sendToOllama(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const MAX_RETRIES = 3;
        const OLLAMA_URL = 'http://localhost:11434/api/generate';
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                console.log(`[DEBUG] Attempting to send to Ollama (attempt ${attempt + 1}/${MAX_RETRIES})`);
                const response = yield axios_1.default.post(OLLAMA_URL, {
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
                }
                else {
                    throw new Error('Invalid response format from Ollama');
                }
            }
            catch (error) {
                const isLastAttempt = attempt === MAX_RETRIES - 1;
                if (error.code === 'ECONNREFUSED') {
                    console.error(`❌ Ollama connection refused on attempt ${attempt + 1}`);
                    if (isLastAttempt) {
                        throw new Error('Ollama service is not running. Please start Ollama and try again.');
                    }
                }
                else if (error.code === 'ENOTFOUND') {
                    console.error(`❌ Ollama host not found on attempt ${attempt + 1}`);
                    if (isLastAttempt) {
                        throw new Error('Ollama host not found. Please check your Ollama configuration.');
                    }
                }
                else if (error.code === 'ETIMEDOUT') {
                    console.error(`❌ Ollama request timeout on attempt ${attempt + 1}`);
                    if (isLastAttempt) {
                        throw new Error('Ollama request timed out. Please try again.');
                    }
                }
                else {
                    console.error(`❌ Ollama error on attempt ${attempt + 1}:`, error.message);
                    if (isLastAttempt) {
                        throw new Error(`Ollama error: ${error.message}`);
                    }
                }
                // Wait before retrying (exponential backoff)
                if (!isLastAttempt) {
                    const waitTime = 1000 * Math.pow(2, attempt);
                    console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                    yield new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        throw new Error("Failed to get response from Ollama after all retries");
    });
}
const router = express_1.default.Router();
const uploadDir = path_1.default.resolve(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (_req, _file, cb) => cb(null, true),
});
router.post('/send-file', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = req.body;
    if (!req.file)
        return res.status(400).json({ message: 'No file uploaded' });
    try {
        const message = yield Message_1.default.create({ from, to, filePath: req.file.filename, type: 'private' });
        index_1.io.emit('chat-message', { from, to, filePath: req.file.filename });
        return res.status(200).json({ message });
    }
    catch (err) {
        console.error('Error saving file message:', err);
        res.status(500).json({ message: 'Error saving file message' });
    }
}));
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, mobile, dob, password } = req.body;
        const existing = yield User_1.default.findOne({ email });
        if (existing)
            return res.status(400).json({ msg: 'Email already exists' });
        const hashed = yield bcryptjs_1.default.hash(password, 10);
        const passcode = Math.floor(100000 + Math.random() * 900000).toString();
        const user = new User_1.default({ username, email, mobile, dob, password: hashed, passcode });
        const result = yield user.save();
        yield (0, emailProducer_1.sendPasscodeEmail)({ email, passcode });
        res.json({ success: true, statusCode: 200, msg: 'User registered successfully.', data: result });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
}));
router.post('/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, passcode } = req.body;
    if (!email || !passcode)
        return res.status(400).json({ msg: 'Email and passcode are required' });
    const user = yield User_1.default.findOne({ email, passcode });
    if (!user)
        return res.status(400).json({ msg: 'Invalid passcode' });
    user.verified = true;
    yield user.save();
    const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    res.status(200).json({ token, statusCode: 200 });
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user)
        return res.status(400).json({ msg: 'User not found' });
    if (!user.verified)
        return res.status(400).json({ msg: 'User not verified' });
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch)
        return res.status(400).json({ msg: 'Wrong password' });
    const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    res.json({ token, user });
}));
router.get('/userlist', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.find();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving users', error });
    }
}));
router.post('/send-msg', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, message, to } = req.body;
    if (!from || !message)
        return res.status(400).json({ msg: 'Missing fields' });
    try {
        yield Message_1.default.create({ from, message, to });
        index_1.io.emit('chat-message', { from, message });
        res.status(200).json({ msg: 'Message sent' });
    }
    catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ msg: 'Server error' });
    }
}));
router.post('/guest-send-msg', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, message, to } = req.body;
    console.log('[DEBUG] Incoming guest message:', { from, message, to });
    if (typeof from !== 'string' || typeof message !== 'string' || !from.trim() || !message.trim()) {
        console.warn('[WARN] Invalid input:', { from, message });
        return res.status(400).json({ msg: 'Missing or invalid "from" or "message" fields' });
    }
    try {
        // Save user message to database first
        const userMessage = yield Message_1.default.create({
            from: from,
            message: message.trim(),
            to: 'AutoBot'
        });
        console.log('[DEBUG] User message saved to DB:', userMessage);
        // Emit the user message confirmation immediately with proper room targeting
        index_1.io.to(from).emit('guest-message', {
            from: from,
            message: message.trim(),
            timestamp: Date.now()
        });
        // Also emit to all clients for debugging (remove if not needed)
        index_1.io.emit('guest-message', {
            from: from,
            message: message.trim(),
            timestamp: Date.now()
        });
        // Send bot typing indicator to the specific room
        console.log('[DEBUG] Sending bot-typing indicator to room:', from);
        index_1.io.to(from).emit('bot-typing', {
            from: 'AutoBot',
            to: from,
            timestamp: Date.now()
        });
        // Also emit globally for fallback
        index_1.io.emit('bot-typing', {
            from: 'AutoBot',
            to: from,
            timestamp: Date.now()
        });
        // Get bot response from Ollama
        let botReply;
        try {
            // Show typing for at least 2 seconds for better UX
            const [ollamaResponse] = yield Promise.all([
                sendToOllama(message),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);
            botReply = ollamaResponse;
        }
        catch (ollamaError) {
            console.error('[ERROR] Ollama failed:', ollamaError);
            // Fallback response when Ollama is unavailable
            botReply = "I'm sorry, I'm currently unavailable. Please try again later.";
        }
        // Save bot response to database
        const botMessage = yield Message_1.default.create({
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
                index_1.io.to(from).emit('bot-stream', {
                    chunk: chunk,
                    accumulatedText: accumulatedText.trim(),
                    timestamp: Date.now()
                });
                // Also emit globally for fallback
                index_1.io.emit('bot-stream', {
                    chunk: chunk,
                    accumulatedText: accumulatedText.trim(),
                    timestamp: Date.now(),
                    roomId: from
                });
                // Variable delay based on chunk length for realistic typing
                const delay = Math.min(200, Math.max(100, chunk.length * 20));
                yield new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        // Send completion signal with final message
        index_1.io.to(from).emit('bot-complete', {
            from: 'AutoBot',
            message: botReply,
            timestamp: Date.now()
        });
        // Global emit for fallback
        index_1.io.emit('bot-complete', {
            from: 'AutoBot',
            message: botReply,
            timestamp: Date.now(),
            roomId: from
        });
        // Final guest-message emit for consistency
        index_1.io.to(from).emit('guest-message', {
            from: 'AutoBot',
            message: botReply,
            timestamp: Date.now()
        });
        // Global emit for fallback
        index_1.io.emit('guest-message', {
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
    }
    catch (error) {
        console.error('[ERROR] Failed to process guest message:', error);
        // Send error message to user
        const errorResponse = "Sorry, I encountered an error processing your message. Please try again.";
        index_1.io.to(from).emit('guest-message', {
            from: 'AutoBot',
            message: errorResponse,
            timestamp: Date.now()
        });
        index_1.io.emit('guest-message', {
            from: 'AutoBot',
            message: errorResponse,
            timestamp: Date.now()
        });
        return res.status(500).json({
            msg: 'Failed to process message. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));
router.get('/messages/:id/:selectedUserId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, selectedUserId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id) || !mongoose_1.default.Types.ObjectId.isValid(selectedUserId)) {
        return res.status(400).json({ msg: 'Invalid user ID' });
    }
    try {
        const messages = yield Message_1.default.find({
            $or: [
                { $and: [{ from: id }, { to: selectedUserId }] },
                { $and: [{ from: selectedUserId }, { to: id }] },
            ],
        }).sort({ createdAt: -1 });
        return res.status(200).json(messages);
    }
    catch (error) {
        return res.status(500).json({ msg: 'Server error while fetching messages' });
    }
}));
router.get('/guest-messages/:id/:selectedUserId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, selectedUserId } = req.params;
    console.log('[DEBUG] Fetching guest messages for:', { id, selectedUserId });
    try {
        const messages = yield Message_1.default.find({
            $or: [
                { $and: [{ from: id }, { to: selectedUserId }] },
                { $and: [{ from: selectedUserId }, { to: id }] },
            ],
        }).sort({ createdAt: 1 }); // Sort ascending for proper chronological order
        console.log('[DEBUG] Found messages:', messages.length);
        return res.status(200).json(messages);
    }
    catch (error) {
        console.error('[ERROR] Failed to fetch guest messages:', error);
        return res.status(500).json({ msg: 'Server error while fetching messages' });
    }
}));
router.get('/user-id/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const userDetails = yield User_1.default.findById(id);
        if (!userDetails)
            return res.status(404).json({ msg: 'User not found' });
        res.json({ data: userDetails });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Server error while fetching user ID' });
    }
}));
router.post('/create-group', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { groupName, userId, adminId } = req.body;
    if (!groupName || !userId || !adminId) {
        return res.status(400).json({ msg: 'Missing fields' });
    }
    try {
        const group = new GroupSchema_1.default({ groupName, userId, adminId });
        const savedGroup = yield group.save();
        res.status(201).json({ msg: 'Group created successfully', data: savedGroup });
    }
    catch (error) {
        res.status(500).json({ msg: 'Server error while creating group' });
    }
}));
router.get('/group-user/:adminId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminId } = req.params;
        const groupUsers = yield GroupSchema_1.default.find({ userId: adminId });
        res.status(200).json(groupUsers);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}));
router.post('/grp-send-msg', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { groupId, sender, message } = req.body;
    if (!message)
        return res.status(400).json({ msg: 'Missing fields' });
    try {
        yield groupMessage_1.GroupMessage.create({ groupId, sender, message });
        index_1.io.emit('chat-message', { sender, message });
        res.status(200).json({ msg: 'Message sent' });
    }
    catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
}));
router.get('/group-messages/:groupId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { groupId } = req.params;
    try {
        const messages = yield groupMessage_1.GroupMessage.find({ groupId }).sort({ createdAt: -1 });
        return res.status(200).json(messages);
    }
    catch (error) {
        return res.status(500).json({ msg: 'Server error while fetching messages' });
    }
}));
exports.default = router;
