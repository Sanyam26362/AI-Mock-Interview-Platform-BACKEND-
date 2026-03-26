const express = require("express");
const multer = require("multer");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { transcribeVoice } = require("../controllers/voice.controller");

// Store audio in memory buffer (don't write to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["audio/webm", "audio/wav", "audio/mp4", "audio/ogg", "audio/mpeg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid audio format"));
  },
});

router.post("/transcribe", protect, upload.single("audio"), transcribeVoice);

module.exports = router;
