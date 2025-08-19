import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  type: { type: String, enum: ['private', 'group'], default: 'private' },
  timestamp: { type: Date, default: Date.now },
  filePath: String,
   createdAt: Date,  // ✅ Added
  updatedAt : Date // ✅ Added
});

export default mongoose.model('Message', MessageSchema);
