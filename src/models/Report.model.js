const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  sessionId:    { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  scores: {
    communication:  { type: Number, min: 0, max: 10 },
    technicalAccuracy: { type: Number, min: 0, max: 10 },
    confidence:     { type: Number, min: 0, max: 10 },
    clarity:        { type: Number, min: 0, max: 10 },
    overall:        { type: Number, min: 0, max: 10 },
  },
  feedback:     { type: String },
  strengths:    [String],
  improvements: [String],
  fillerWords:  { count: Number, words: [String] },
  language:     { type: String },
  generatedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
