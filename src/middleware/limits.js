import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,                // 20 requests / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down" }
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,                // 10 signups / hr / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many signups from this IP. Try again later." }
});
