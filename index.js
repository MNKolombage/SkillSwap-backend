import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for frontend
app.use(cors({
  origin: "http://localhost:3000",  // your React app URL
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  credentials: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Use authentication routes
app.use('/api/auth', authRoutes);

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
