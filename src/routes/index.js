const express = require("express");
const router = express.Router();

router.use("/webhooks", require("./webhook.routes"));
router.use("/users", require("./user.routes"));
router.use("/sessions", require("./session.routes"));
router.use("/questions", require("./question.routes"));
router.use("/evaluation", require("./evaluation.routes"));
router.use("/voice", require("./voice.routes"));
router.use("/resume", require("./resume.routes"));
router.use("/analytics", require("./analytics.routes"));

module.exports = router;