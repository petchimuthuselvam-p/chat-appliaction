import mongoose from 'mongoose';

const groupMessage = new mongoose.Schema({
  groupId: mongoose.Schema.Types.ObjectId,
  sender: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  
});

export const GroupMessage = mongoose.model('GroupMessage', groupMessage);

