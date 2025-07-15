import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  from: String,
  to: String, // could be userId or groupId
  message: String,
  type: { type: String, enum: ['private', 'group'], default: 'private' },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('Message', MessageSchema);
