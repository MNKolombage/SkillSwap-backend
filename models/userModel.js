import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Create User Model
const User = mongoose.model('User', userSchema);

export default User;
