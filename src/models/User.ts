import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  mobile:   { type: String },
  dob:      { type: Date },
  password: { type: String, required: true },
  role:     { type: String, default: 'user' },
  passcode: { type: String },
  verified: { type: Boolean, default: false }
});

export default mongoose.model('user_detail', userSchema);
