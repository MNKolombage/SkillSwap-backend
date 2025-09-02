// src/routes/auth.routes.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import rateLimit from "express-rate-limit";
import { User } from "../models/User.js";

const router = Router();

// ----- rate limits (declare once) -----
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// ----- helpers -----
function sign(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function setAuthCookie(res, token) {
  res.cookie(process.env.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// ----- routes -----

// POST /api/auth/signup
router.post("/signup", signupLimiter, async (req, res) => {
  try {
    let { fullName, email, password } = req.body;
    fullName = (fullName || "").trim();
    email = (email || "").trim().toLowerCase();

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Full name, email and password are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^\w\s]/.test(password)
    ) {
      return res.status(400).json({
        message: "Weak password: min 8 chars with upper, lower, number, symbol",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email is already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ fullName, email, passwordHash });

    const token = sign(user._id.toString());
    setAuthCookie(res, token);

    res.status(201).json({ message: "Account created successfully" });
  } catch (e) {
    console.error("signup error:", e);
    res.status(500).json({ message: "Failed to sign up" });
  }
});

// POST /api/auth/signin
router.post("/signin", authLimiter, async (req, res) => {
  try {
    let { email, password } = req.body;
    email = (email || "").trim().toLowerCase();

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (!password) return res.status(400).json({ message: "Password is required" });

    const user = await User.findOne({ email });

    // reduce user-enumeration signals
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!user || typeof user.passwordHash !== "string" || !user.passwordHash.startsWith("$2")) {
      await sleep(250);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let ok = false;
    try {
      ok = await bcrypt.compare(password, user.passwordHash);
    } catch {
      await sleep(250);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!ok) {
      await sleep(250);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = sign(user._id.toString());
    setAuthCookie(res, token);

    const safeUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      role: user.role || "Both",
    };

    return res.json({ user: safeUser });
  } catch (err) {
    console.error("signin error:", err);
    return res.status(500).json({ message: "Failed to sign in" });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.[process.env.COOKIE_NAME];
    if (!token) return res.json(null);
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select("fullName email avatarUrl role");
    return res.json(user || null);
  } catch {
    return res.json(null);
  }
});

// POST /api/auth/signout
router.post("/signout", (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME).json({ ok: true });
});

export default router;
