const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

jest.mock("../src/middlewares/auth.middleware", () => ({
  protect: (req, res, next) => {
    req.user = {
      _id: new mongoose.Types.ObjectId("64b1f2c3d4e5f6a7b8c9d0e1"),
      clerkId: "test_clerk_id",
      email: "test@example.com",
      role: "candidate",
    };
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

describe("Session Routes", () => {
  let sessionId;

  it("POST /api/v1/sessions — should create a session", async () => {
    const res = await request(app)
      .post("/api/v1/sessions")
      .send({ domain: "sde", language: "en", mode: "text" });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.domain).toBe("sde");
    sessionId = res.body.data._id;
  });

  it("GET /api/v1/sessions — should return session list", async () => {
    const res = await request(app).get("/api/v1/sessions");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/v1/sessions/:id/turn — should add a turn", async () => {
    if (!sessionId) return;
    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId}/turn`)
      .send({ speaker: "user", text: "I have 3 years of experience in React.", language: "en" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.transcript.length).toBeGreaterThan(0);
  });

  it("PATCH /api/v1/sessions/:id/complete — should mark session complete", async () => {
    if (!sessionId) return;
    const res = await request(app).patch(`/api/v1/sessions/${sessionId}/complete`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("completed");
  });
});
