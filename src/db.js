import mongoose from "mongoose";

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: true,
    maxPoolSize: 10,
  });
  console.log("✅ MongoDB connected");
}
