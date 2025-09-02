import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = Router();

function sign(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, passwordHash: hash });

    const token = sign(user._id.toString());
    res
      .cookie(process.env.COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      })
      .status(201)
      .json({ id: user._id, fullName: user.fullName, email: user.email });
  } catch (e) {
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = sign(user._id.toString());
    res
      .cookie(process.env.COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      })
      .json({ id: user._id, fullName: user.fullName, email: user.email });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME).json({ ok: true });
});

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.[process.env.COOKIE_NAME];
    if (!token) return res.status(200).json(null);
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select("-passwordHash");
    res.json(user);
  } catch {
    res.json(null);
  }
});

// Legacy endpoint compatible with your initial FE
router.get("/users", async (_req, res) => {
  const users = await User.find().select("-passwordHash").limit(200);
  res.json(users);
});

export default router;
