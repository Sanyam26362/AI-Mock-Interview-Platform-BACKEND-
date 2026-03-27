const Session = require("../models/Session.model");
const Report = require("../models/Report.model");
const { sendSuccess, sendError } = require("../utils/response");
const { generateEvaluation } = require("../services/evaluation.service");

const evaluateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return sendError(res, "Session not found", 404);

    // 1. Get the raw ML response
    const evaluation = await generateEvaluation(session.transcript, session.domain, session.language);

    // 2. Transform the filler words from an object into an array and a total count
    const rawFillerWords = evaluation.filler_words || {};
    const fillerWordsArray = Object.keys(rawFillerWords); 
    const totalFillerCount = Object.values(rawFillerWords).reduce((sum, val) => sum + val, 0);

    // 3. Map the ML data to match your Mongoose Schema exactly
    const formattedEvaluation = {
      scores: {
        communication: evaluation.scores?.communication || 0,
        technicalAccuracy: evaluation.scores?.technical_accuracy || 0, // Maps snake_case to camelCase!
        confidence: evaluation.scores?.confidence || 0,
        clarity: evaluation.scores?.clarity || 0,
        overall: evaluation.scores?.overall || 0
      },
      feedback: evaluation.feedback || "",
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      fillerWords: {
        count: totalFillerCount,
        words: fillerWordsArray
      }
    };

    // 4. Create the report using the perfectly formatted data
    const report = await Report.create({ 
      sessionId: session._id, 
      userId: session.userId, 
      ...formattedEvaluation, 
      language: session.language 
    });

    await Session.findByIdAndUpdate(session._id, { reportId: report._id, status: "completed", completedAt: new Date() });
    
    sendSuccess(res, report, "Evaluation complete", 201);
  } catch (error) {
    console.error("Evaluation Error:", error);
    sendError(res, "An error occurred during evaluation", 500);
  }
};

const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId).populate("sessionId");
    if (!report) return sendError(res, "Report not found", 404);
    sendSuccess(res, report);
  } catch (error) {
    console.error("Fetch Report Error:", error);
    sendError(res, "Failed to fetch report", 500);
  }
};

module.exports = { evaluateSession, getReport };