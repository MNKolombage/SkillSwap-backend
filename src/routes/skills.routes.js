import { Router } from "express";
import { User } from "../models/User.js";

const router = Router();

/**
 * GET /api/skills
 * Returns a deduped list of skills from both offered & wanted arrays
 */
router.get("/", async (_req, res) => {
  const [offered, wanted] = await Promise.all([
    User.distinct("skillsOffered"),
    User.distinct("skillsWanted")
  ]);
  const set = new Set([...offered, ...wanted].filter(Boolean).map(s => s.trim()));
  res.json(Array.from(set).sort((a, b) => a.localeCompare(b)));
});

export default router;
