import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  groupName: String,
  userId: [String], // user IDs
  adminId:String,
  filePath:String
});

export default mongoose.model('Group', GroupSchema);
