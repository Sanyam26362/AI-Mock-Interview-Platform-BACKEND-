const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
// Updated: Destructured notFound alongside errorHandler
const { errorHandler, notFound } = require("./src/middlewares/error.middleware");
const routes = require("./src/routes");
require("dotenv").config();

const app = express();

// Security & logging
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// IMPORTANT: Clerk webhook must come BEFORE express.json()
app.use("/api/v1/webhooks/clerk", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1", routes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// 404 handler (must be after all routes, before error handler)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;