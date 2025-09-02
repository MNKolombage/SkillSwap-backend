// server/src/routes/auth.routes.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authLimiter, signupLimiter } from "../middleware/limits.js";
import { validateEmail, validatePassword, validateFullName } from "../utils/validate.js";

const router = Router();

function sign(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function setAuthCookie(res, token) {
  res.cookie(process.env.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

/**
 * POST /api/auth/signup
 * body: { fullName, email, password }
 * returns: { message }
 */
router.post("/signup", signupLimiter, async (req, res) => {
  try {
    const nameCheck = validateFullName(req.body.fullName);
    if (!nameCheck.ok) return res.status(400).json({ message: nameCheck.message });

    const emailCheck = validateEmail(req.body.email);
    if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });

    const passCheck = validatePassword(req.body.password);
    if (!passCheck.ok) return res.status(400).json({ message: passCheck.message });

    const email = emailCheck.email;
    const fullName = nameCheck.fullName;
    const passwordHash = await bcrypt.hash(req.body.password, 12);

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email is already registered" });

    const user = await User.create({ fullName, email, passwordHash });

    const token = sign(user._id.toString());
    setAuthCookie(res, token);

    return res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ message: "Failed to sign up" });
  }
});

/**
 * POST /api/auth/signin
 * body: { email, password }
 * returns: { user }
 */
router.post("/signin", authLimiter, async (req, res) => {
  try {
    const emailCheck = validateEmail(req.body.email);
    if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });

    const password = String(req.body.password || "");
    if (!password) return res.status(400).json({ message: "Password is required" });

    const user = await User.findOne({ email: emailCheck.email });
    // Always take constant time-ish for error responses to reduce user enumeration hints
    if (!user) {
      await new Promise(r => setTimeout(r, 250));
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = sign(user._id.toString());
    setAuthCookie(res, token);

    const safeUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      role: user.role || "Both"
    };

    return res.json({ user: safeUser });
  } catch (err) {
    console.error("signin error:", err);
    return res.status(500).json({ message: "Failed to sign in" });
  }
});

/**
 * GET /api/auth/me
 * returns logged-in user or null
 */
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

/**
 * POST /api/auth/signout
 */
router.post("/signout", (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME).json({ ok: true });
});

export default router;
