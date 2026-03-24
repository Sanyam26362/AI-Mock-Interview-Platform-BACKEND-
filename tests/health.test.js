const request = require("supertest");
const app = require("../app");

describe("Health Check", () => {
  it("GET /health — should return ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/v1/unknown — should return 404", async () => {
    const res = await request(app).get("/api/v1/unknown-route");
    expect(res.statusCode).toBe(404);
  });
});
