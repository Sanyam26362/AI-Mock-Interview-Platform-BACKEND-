const Session = require("../models/Session.model");
const { sendSuccess, sendError } = require("../utils/response");
const { parseResume } = require("../services/ai.service"); 

/**
 * POST /api/v1/resume/parse
 * Accepts PDF file → sends to ML via ai.service → returns parsed resume data
 */
const handleParseResume = async (req, res) => {
  try {
    if (!req.file) return sendError(res, "No PDF file provided", 400);
    if (req.file.mimetype !== "application/pdf")
      return sendError(res, "Only PDF files are accepted", 400);

    // Call the service with the raw buffer straight from multer
    const parsedData = await parseResume(req.file.buffer);

    sendSuccess(res, parsedData, "Resume parsed successfully");
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
const handleParseAndStartInterview = async (req, res) => {
  try {
    if (!req.file) return sendError(res, "No PDF file provided", 400);

    const { domain = "sde", language = "en", mode = "text" } = req.body;

    // Call the service with the raw buffer
    const parsedData = await parseResume(req.file.buffer);

    // Create the session with the data returned from the ML service
    const session = await Session.create({
      userId: req.user._id,
      clerkId: req.user.clerkId,
      domain,
      language,
      mode,
      resumeData: {
        name: parsedData.name,
        skills: parsedData.skills,
        experienceYears: parsedData.experience_years,
        education: parsedData.education,
        previousRoles: parsedData.previous_roles,
        suggestedQuestions: parsedData.suggested_questions,
      },
    });

    sendSuccess(res, { session, resumeData: parsedData }, "Session created", 201);
  } catch (err) {
    console.error("[Resume] Start error:", err.message);
    sendError(res, "Failed to process resume", 500);
  }
};

module.exports = { 
  parseResume: handleParseResume, 
  parseAndStartInterview: handleParseAndStartInterview 
};