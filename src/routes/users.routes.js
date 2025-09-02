import { Router } from "express";
import { User } from "../models/User.js";

const router = Router();

/**
 * GET /api/users
 * Query: q, offered=React,Node, wanted=Python, role=Both, location=Colombo, page=1, limit=12
 * Response: { data, page, total, totalPages }
 */
router.get("/", async (req, res) => {
  const {
    q = "",
    offered = "",
    wanted = "",
    role,
    location = "",
    page = 1,
    limit = 12
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);

  const filter = {};
  if (role && role !== "Any") filter.role = role;

  const offeredArr = typeof offered === "string" && offered
    ? offered.split(",").map(s => s.trim()).filter(Boolean)
    : [];
  const wantedArr = typeof wanted === "string" && wanted
    ? wanted.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  if (offeredArr.length) filter.skillsOffered = { $in: offeredArr };
  if (wantedArr.length) filter.skillsWanted = { $in: wantedArr };
  if (location) filter.location = { $regex: new RegExp(location, "i") };

  let query = User.find(filter).select("-passwordHash");

  if (q) {
    query = User.find({
      ...filter,
      $or: [
        { fullName: { $regex: q, $options: "i" } },
        { skillsOffered: { $elemMatch: { $regex: q, $options: "i" } } },
        { skillsWanted: { $elemMatch: { $regex: q, $options: "i" } } }
      ]
    }).select("-passwordHash");
  }

  const total = await User.countDocuments(query.getFilter());
  const data = await query
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const totalPages = Math.max(Math.ceil(total / limitNum), 1);
  res.json({ data, page: pageNum, total, totalPages });
});

export default router;
