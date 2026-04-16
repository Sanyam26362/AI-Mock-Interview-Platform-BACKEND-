const mongoose = require("mongoose");

const turnSchema = new mongoose.Schema({
  speaker:   { type: String, enum: ["ai", "user"] },
  text:      { type: String },
  language:  { type: String },
  audioUrl:  { type: String },
  timestamp: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  clerkId:     { type: String, required: true },
  domain:      { type: String, required: true },
  language:    { type: String, default: "en" },
  status:      { type: String, enum: ["active", "completed", "abandoned"], default: "active" },
  mode:        { type: String, enum: ["text", "voice", "live"], default: "text" },
  transcript:  [turnSchema],
  reportId:    { type: mongoose.Schema.Types.ObjectId, ref: "Report" },
  duration:    { type: Number },
  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date },

  // Resume-based interview data (populated when user uploads resume)
  resumeData: {
    name:               { type: String },
    skills:             [String],
    experienceYears:    { type: Number },
    education:          { type: String },
    previousRoles:      [String],
    suggestedQuestions: [String],
  },
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);
