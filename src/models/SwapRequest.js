import mongoose from "mongoose";

const SwapRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Accepted", "Declined"], default: "Pending", index: true }
  },
  { timestamps: true }
);

SwapRequestSchema.index({ from: 1, to: 1 }, { unique: false });

export const SwapRequest = mongoose.model("SwapRequest", SwapRequestSchema);
