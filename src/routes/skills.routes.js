import { Router } from "express";
import { User } from "../models/User.js";

const router = Router();

/**
 * GET /api/skills
 * Returns distinct skills from both offered & wanted arrays
 */
router.get("/", async (_req, res) => {
  // Aggregate distinct values across both arrays
  const [offered, wanted] = await Promise.all([
    User.distinct("skillsOffered"),
    User.distinct("skillsWanted")
  ]);
  // Unique union, sorted
  const set = new Set([...offered, ...wanted].filter(Boolean).map(s => s.trim()));
  res.json(Array.from(set).sort((a, b) => a.localeCompare(b)));
});

export default router;
