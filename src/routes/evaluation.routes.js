const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { evaluateSession, getReport } = require("../controllers/evaluation.controller");
router.post("/:sessionId", protect, evaluateSession);
router.get("/report/:reportId", protect, getReport);
module.exports = router;
