const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middlewares/auth.middleware");
const { getQuestions, createQuestion } = require("../controllers/question.controller");
router.get("/", protect, getQuestions);
router.post("/", protect, requireRole("admin"), createQuestion);
module.exports = router;
