import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { SwapRequest } from "../models/SwapRequest.js";

const router = Router();

/**
 * POST /api/swaps
 * body: { toUserId, message }
 */
router.post("/", authRequired, async (req, res) => {
  const { toUserId, message = "" } = req.body;
  if (!toUserId) return res.status(400).json({ message: "toUserId required" });
  if (toUserId === req.user.id) return res.status(400).json({ message: "Cannot send request to yourself" });

  const doc = await SwapRequest.create({
    from: req.user.id,
    to: toUserId,
    message: message.slice(0, 1000)
  });

  res.status(201).json(doc);
});

/**
 * GET /api/swaps/mine
 * Returns swaps where current user is either sender or receiver
 */
router.get("/mine", authRequired, async (req, res) => {
  const userId = req.user.id;
  const swaps = await SwapRequest.find({
    $or: [{ from: userId }, { to: userId }]
  })
    .sort({ createdAt: -1 })
    .populate("from", "fullName avatarUrl")
    .populate("to", "fullName avatarUrl")
    .lean();

  res.json(swaps);
});

/**
 * PATCH /api/swaps/:id
 * body: { action: "accept" | "decline" }
 * Only the receiver can accept/decline
 */
router.patch("/:id", authRequired, async (req, res) => {
  const { action } = req.body;
  const _id = req.params.id;

  const swap = await SwapRequest.findById(_id);
  if (!swap) return res.status(404).json({ message: "Not found" });

  if (swap.to.toString() !== req.user.id) {
    return res.status(403).json({ message: "Only the receiver can update this request" });
  }

  if (!["accept", "decline"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  swap.status = action === "accept" ? "Accepted" : "Declined";
  await swap.save();

  res.json(swap);
});

export default router;
