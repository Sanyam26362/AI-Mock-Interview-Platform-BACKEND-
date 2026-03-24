const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

jest.mock("../src/middlewares/auth.middleware", () => ({
  protect: (req, res, next) => {
    req.user = { _id: new mongoose.Types.ObjectId(), role: "admin", clerkId: "test" };
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

describe("Question Routes", () => {
  it("GET /api/v1/questions — should return questions array", async () => {
    const res = await request(app).get("/api/v1/questions?domain=sde&limit=5");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/v1/questions — admin should create a question", async () => {
    const res = await request(app)
      .post("/api/v1/questions")
      .send({
        domain: "sde",
        difficulty: "easy",
        question: "What is a closure in JavaScript?",
        tags: ["javascript", "fundamentals"],
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.question).toBe("What is a closure in JavaScript?");
  });
});
