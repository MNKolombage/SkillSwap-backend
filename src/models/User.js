import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["Learner", "Mentor", "Both"], default: "Both", index: true },
    skillsOffered: { type: [String], default: [], index: true },
    skillsWanted: { type: [String], default: [], index: true },
    location: { type: String, default: "", index: true }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
