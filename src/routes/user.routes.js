const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { getMe, updateMe, getMyStats } = require("../controllers/user.controller");
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.get("/me/stats", protect, getMyStats);
module.exports = router;
