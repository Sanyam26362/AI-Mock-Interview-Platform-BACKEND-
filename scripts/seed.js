const mongoose = require("mongoose");
const User = require("../src/models/User.model");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email: "admin@interviewai.com" });
    if (existing) {
      console.log("Admin already exists, skipping.");
      process.exit(0);
    }

    await User.create({
      clerkId: "admin_seed_clerk_id",
      email: "admin@interviewai.com",
      firstName: "Admin",
      lastName: "InterviewAI",
      role: "admin",
      plan: "enterprise",
      interviewsLimit: 99999,
    });

    console.log("Admin user seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
};

seedAdmin();

