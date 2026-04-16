const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  getOverview,
  getByDomain,
  getWeeklyProgress,
  getReports,
} = require("../controllers/analytics.controller");

router.get("/overview", protect, getOverview);
router.get("/by-domain", protect, getByDomain);
router.get("/weekly", protect, getWeeklyProgress);
router.get("/reports", protect, getReports);

module.exports = router;
