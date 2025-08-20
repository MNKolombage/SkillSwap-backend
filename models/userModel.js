import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Extra profile fields
  homeTown: { type: String, default: "" },
  age: { type: Number, default: null },
  currentPosition: { type: String, default: "" },
  skillsWanted: { type: [String], default: [] },
  skillsOffered: { type: [String], default: [] },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
