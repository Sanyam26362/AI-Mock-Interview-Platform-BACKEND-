const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler } = require("./src/middlewares/error.middleware");
const routes = require("./src/routes");
require("dotenv").config();

const app = express();

// Security & logging
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1", routes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
