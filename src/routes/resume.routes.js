const express = require("express");
const multer = require("multer");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { parseResume, parseAndStartInterview } = require("../controllers/resume.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files allowed"));
  },
});

router.post("/parse", protect, upload.single("resume"), parseResume);
router.post("/start-interview", protect, upload.single("resume"), parseAndStartInterview);

module.exports = router;
