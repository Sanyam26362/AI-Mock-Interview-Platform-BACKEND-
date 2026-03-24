const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler, notFound } = require("./src/middlewares/error.middleware");
const routes = require("./src/routes");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// ⚠️ CRITICAL — This MUST come BEFORE express.json()
// Clerk webhook needs raw body for Svix signature verification
app.use(
  "/api/v1/webhooks/clerk",
  express.raw({ type: "application/json" })
);

// JSON parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;