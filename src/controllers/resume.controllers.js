const axios = require("axios");
const Session = require("../models/Session.model");
const { sendSuccess, sendError } = require("../utils/response");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/v1/resume/parse
 * Accepts PDF file → sends to ML as base64 → returns parsed resume data
 */
const parseResume = async (req, res) => {
  try {
    if (!req.file) return sendError(res, "No PDF file provided", 400);
    if (req.file.mimetype !== "application/pdf")
      return sendError(res, "Only PDF files are accepted", 400);

    const base64 = req.file.buffer.toString("base64");

    const mlRes = await axios.post(
      `${ML_SERVICE_URL}/parse-resume`,
      { resume_base64: base64 },
      { timeout: 60000, headers: { "Content-Type": "application/json" } }
    );

    sendSuccess(res, mlRes.data, "Resume parsed successfully");
  } catch (err) {
    console.error("[Resume] Parse error:", err.message);
    const detail = err.response?.data?.detail;
    sendError(res, detail ? `ML error: ${detail}` : "Failed to parse resume", 500);
  }
};

/**
 * POST /api/v1/resume/start-interview
 * Parse resume + create session in one shot
 */
const parseAndStartInterview = async (req, res) => {
  try {
    if (!req.file) return sendError(res, "No PDF file provided", 400);

    const { domain = "sde", language = "en", mode = "text" } = req.body;
    const base64 = req.file.buffer.toString("base64");

    const mlRes = await axios.post(
      `${ML_SERVICE_URL}/parse-resume`,
      { resume_base64: base64 },
      { timeout: 60000, headers: { "Content-Type": "application/json" } }
    );
    const parsed = mlRes.data;

    const session = await Session.create({
      userId: req.user._id,
      clerkId: req.user.clerkId,
      domain,
      language,
      mode,
      resumeData: {
        name: parsed.name,
        skills: parsed.skills,
        experienceYears: parsed.experience_years,
        education: parsed.education,
        previousRoles: parsed.previous_roles,
        suggestedQuestions: parsed.suggested_questions,
      },
    });

    sendSuccess(res, { session, resumeData: parsed }, "Session created", 201);
  } catch (err) {
    console.error("[Resume] Start error:", err.message);
    sendError(res, "Failed to process resume", 500);
  }
};

module.exports = { parseResume, parseAndStartInterview };
