const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  clerkId:      { type: String, required: true, unique: true },
  email:        { type: String, required: true, unique: true },
  firstName:    { type: String },
  lastName:     { type: String },
  profileImage: { type: String },
  role:         { type: String, enum: ["candidate", "hr", "admin"], default: "candidate" },
  preferredLanguage: { type: String, default: "en" },
  domain:       { type: String, enum: ["sde", "data_analyst", "hr", "marketing", "finance", "product"], default: "sde" },
  streak:       { type: Number, default: 0 },
  lastActive:   { type: Date },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
  plan:         { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  interviewsUsed: { type: Number, default: 0 },
  interviewsLimit: { type: Number, default: 2 },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
