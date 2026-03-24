const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../src/models/User.model");

// Mock Clerk auth middleware for testing
jest.mock("../src/middlewares/auth.middleware", () => ({
  protect: (req, res, next) => {
    req.user = {
      _id: new mongoose.Types.ObjectId(),
      clerkId: "test_clerk_id",
      email: "test@example.com",
      firstName: "Test",
      role: "candidate",
      plan: "free",
      streak: 3,
      interviewsUsed: 1,
    };
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

describe("User Routes", () => {
  it("GET /api/v1/users/me — should return current user", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("test@example.com");
  });

  it("PUT /api/v1/users/me — should update profile", async () => {
    const res = await request(app)
      .put("/api/v1/users/me")
      .send({ firstName: "Updated", preferredLanguage: "hi" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/v1/users/me/stats — should return stats", async () => {
    const res = await request(app).get("/api/v1/users/me/stats");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("streak");
    expect(res.body.data).toHaveProperty("totalInterviews");
  });
});
