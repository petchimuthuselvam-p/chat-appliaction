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
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const emailListener_1 = require("./kafka/emailListener");
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
exports.io = io;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
console.log('Static files served from /uploads: ' + path_1.default.join(__dirname, '../uploads'));
// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in the .env file');
    process.exit(1);
}
console.log('Mongo URI:', mongoURI);
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(mongoURI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            family: 4,
            retryWrites: true,
        });
        console.log('✅ MongoDB connected successfully');
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            try {
                (0, emailListener_1.startEmailListener)();
                console.log('📧 Email listener started');
            }
            catch (error) {
                console.error('❌ Email listener failed to start:', error);
            }
        });
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
});
// Mongo events
mongoose_1.default.connection.on('connected', () => {
    console.log('📊 Mongoose connected to MongoDB');
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.log('📊 Mongoose disconnected from MongoDB');
});
// 🔌 Socket.IO Logic
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    socket.on('guest-message', (data) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('📩 Guest message received via socket:', data);
        const { message } = data;
        try {
            const aiResponse = yield axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: message }]
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            const botReply = aiResponse.data.choices[0].message.content;
            console.log('🤖 Bot reply to guest:', botReply);
            io.emit('guest-message', {
                from: 'AutoBot',
                message: botReply
            });
        }
        catch (err) {
            console.error('❌ OpenAI bot error:', err);
        }
    }));
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
    socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
    });
});
// Graceful shutdown handlers
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n🛑 Shutting down server...');
    try {
        yield mongoose_1.default.connection.close();
        console.log('✅ MongoDB connection closed');
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    try {
        yield mongoose_1.default.connection.close();
        console.log('✅ MongoDB connection closed');
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}));
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});
// Start DB and server
connectDB();
