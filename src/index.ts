import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes'; // Ensure the file is at ./routes/authRoutes.ts or .js
import { startEmailListener } from './kafka/emailListener';


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

console.log('Mongo URI:', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI!).then(() => {
  console.log('MongoDB connected');
});

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('chat-message', (msg) => {
    io.emit('chat-message', msg);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

startEmailListener();
