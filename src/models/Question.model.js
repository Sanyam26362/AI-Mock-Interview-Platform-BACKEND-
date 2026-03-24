const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  domain:      { type: String, required: true },
  difficulty:  { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  question:    { type: String, required: true },
  sampleAnswer:{ type: String },
  tags:        [String],
  language:    { type: String, default: "en" },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

questionSchema.index({ domain: 1, difficulty: 1 });
module.exports = mongoose.model("Question", questionSchema);
