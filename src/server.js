import "dotenv/config.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { connectDB } from "./db.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import helmet from "helmet";

if (!process.env.JWT_SECRET) { console.error("❌ Missing JWT_SECRET"); process.exit(1); }
if (!process.env.COOKIE_NAME) { console.error("❌ Missing COOKIE_NAME"); process.exit(1); }

const app = express();

const allowlist = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "")
  .split(",").map(s => s.trim()).filter(Boolean);
if (allowlist.length === 0) allowlist.push("http://localhost:3000","http://localhost:5173");

app.use(cors({
  origin(origin, cb){ if(!origin || allowlist.includes(origin)) return cb(null,true); cb(new Error("Not allowed by CORS"), false); },
  credentials: true
}));
app.use((_,res,next)=>{ res.header("Vary","Origin"); next(); });
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/skills", skillsRoutes);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const port = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => console.log(`🚀 Auth API on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
