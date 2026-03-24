const express = require("express");
const router = express.Router();
const { handleClerkWebhook } = require("../controllers/webhook.controller");
router.post("/clerk", express.raw({ type: "application/json" }), handleClerkWebhook);
module.exports = router;
