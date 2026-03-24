const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  clerkOrgId:{ type: String, unique: true },
  plan:      { type: String, enum: ["starter", "growth", "enterprise"], default: "starter" },
  credits:   { type: Number, default: 10 },
  logo:      { type: String },
  domain:    { type: String },
  members:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = mongoose.model("Organization", organizationSchema);
