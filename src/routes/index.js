const express = require("express");
const router = express.Router();

router.use("/webhooks", require("./webhook.routes"));
router.use("/users", require("./user.routes"));
router.use("/sessions", require("./session.routes"));
router.use("/questions", require("./question.routes"));
router.use("/evaluation", require("./evaluation.routes"));

module.exports = router;
