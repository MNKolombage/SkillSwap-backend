import { Router } from "express";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const router = Router();

// GET /api/users/:id - get user by id (public profile)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const user = await User.findById(id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user" });
  }
});
router.get("/", async (req, res) => {
  const {
    q = "",
    offered = "",
    wanted = "",
    role,
    location = "",
    page = 1,
    limit = 12,
    exclude = "",          
    excludeSelf = "0"      
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);

  const filter = {};

  // Build exclusion list
  const excludeIds = [];
  if (exclude) {
    exclude.split(",").map(s => s.trim()).filter(Boolean).forEach(id => {
      if (mongoose.isValidObjectId(id)) excludeIds.push(new mongoose.Types.ObjectId(id));
    });
  }
  if ((excludeSelf === "1" || excludeSelf === "true") && req.cookies?.[process.env.COOKIE_NAME]) {
    try {
      const { id } = jwt.verify(req.cookies[process.env.COOKIE_NAME], process.env.JWT_SECRET);
      if (mongoose.isValidObjectId(id)) excludeIds.push(new mongoose.Types.ObjectId(id));
    } catch { /* ignore bad/absent token */ }
  }
  if (excludeIds.length) filter._id = { $nin: excludeIds };

  if (role && role !== "Any") filter.role = role;

  const offeredArr = offered ? String(offered).split(",").map(s => s.trim()).filter(Boolean) : [];
  const wantedArr = wanted ? String(wanted).split(",").map(s => s.trim()).filter(Boolean) : [];

  if (offeredArr.length) filter.skillsOffered = { $in: offeredArr };
  if (wantedArr.length) filter.skillsWanted = { $in: wantedArr };
  if (location) filter.location = { $regex: new RegExp(location, "i") };

  let query = User.find(filter).select("-passwordHash");
  if (q) {
    query = User.find({
      ...filter,
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { skillsOffered: { $elemMatch: { $regex: q, $options: "i" } } },
        { skillsWanted: { $elemMatch: { $regex: q, $options: "i" } } }
      ]
    }).select("-passwordHash");
  }

  const total = await User.countDocuments(query.getFilter());
  const data = await query.sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean();
  const totalPages = Math.max(Math.ceil(total / limitNum), 1);

  res.json({ data, page: pageNum, total, totalPages });
});


// PATCH /api/users/profile – update currently logged in user
router.patch("/profile", async (req, res) => {
  try {
    const token = req.cookies?.[process.env.COOKIE_NAME];
    if (!token) return res.status(401).json({ message: "Not signed in" });

    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only update allowed fields
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
      "location",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    user = await user.save();

    res.json({ user: user.toObject({ versionKey: false }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

export default router;
