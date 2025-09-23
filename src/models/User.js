// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["Learner", "Mentor", "Both"], 
    default: "Both" 
  },
  homeTown: String,
  age: Number,
  currentPosition: String,
  skillsWanted: [String],
  skillsOffered: [String],
  avatarUrl: String,
  location: String,
  bio: String,
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);
