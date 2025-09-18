// src/routes/auth.routes.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = Router();

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie
    res.cookie(process.env.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response
    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: "Both",
    });

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie
    res.cookie(process.env.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send response
    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user profile
router.get("/me", async (req, res) => {
  try {
    // Get token from cookie
    const token = req.cookies?.[process.env.COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Verify token
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user (exclude password hash)
    const user = await User.findById(id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user data
    res.json({ user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(401).json({ message: "Invalid or expired session" });
  }
});

// Update current user profile
router.patch("/me", async (req, res) => {
  try {
    const token = req.cookies?.[process.env.COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    const allowedFields = [
      "firstName",
      "lastName",
      "homeTown",
      "age",
      "currentPosition",
      "skillsWanted",
      "skillsOffered",
      "avatarUrl",
      "role",
      "bio"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    user = await user.save();
    res.json({ user: user.toObject({ versionKey: false, hide: "passwordHash" }) });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

export default router;
