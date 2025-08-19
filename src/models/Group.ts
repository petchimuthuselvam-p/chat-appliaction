import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  groupName: String,
  members: [String], // user IDs
});

export default mongoose.model('Group', GroupSchema);
