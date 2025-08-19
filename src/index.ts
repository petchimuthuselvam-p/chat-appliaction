import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { startEmailListener } from './kafka/emailListener';
import path from 'path';
import axios from 'axios';
import authRoutes from  './routes/authRoutes';


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

export { io };

// Middleware
app.use(cors());
app.use(express.json());
// app.use('/api/auth', authRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('Static files served from /uploads: ' + path.join(__dirname, '../uploads'));
// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('❌ MONGODB_URI is not defined in the .env file');
  process.exit(1);
}



const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
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
        startEmailListener();
        console.log('📧 Email listener started');
      } catch (error) {
        console.error('❌ Email listener failed to start:', error);
      }
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Mongo events
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('📊 Mongoose disconnected from MongoDB');
});

// 🔌 Socket.IO Logic
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('guest-message', async (data) => {
    console.log('📩 Guest message received via socket:', data);

    const { message } = data;

    try {
      const aiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: message }]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const botReply = aiResponse.data.choices[0].message.content;
      console.log('🤖 Bot reply to guest:', botReply);

      io.emit('guest-message', {
        from: 'AutoBot',
        message: botReply
      });

    } catch (err) {
      console.error('❌ OpenAI bot error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');

  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');

    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');

  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');

    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

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
