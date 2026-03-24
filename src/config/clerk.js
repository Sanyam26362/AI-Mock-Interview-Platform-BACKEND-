const { clerkMiddleware, requireAuth } = require("@clerk/clerk-sdk-node");
require("dotenv").config();

// Middleware to protect routes
const protect = requireAuth();

module.exports = { clerkMiddleware, protect };
