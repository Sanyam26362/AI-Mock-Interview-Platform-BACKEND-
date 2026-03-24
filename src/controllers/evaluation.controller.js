const Session = require("../models/Session.model");
const Report = require("../models/Report.model");
const { sendSuccess, sendError } = require("../utils/response");
const { generateEvaluation } = require("../services/evaluation.service");

const evaluateSession = async (req, res) => {
  const session = await Session.findById(req.params.sessionId);
  if (!session) return sendError(res, "Session not found", 404);

  const evaluation = await generateEvaluation(session.transcript, session.domain, session.language);
  const report = await Report.create({ sessionId: session._id, userId: session.userId, ...evaluation, language: session.language });
  await Session.findByIdAndUpdate(session._id, { reportId: report._id, status: "completed", completedAt: new Date() });
  sendSuccess(res, report, "Evaluation complete", 201);
};

const getReport = async (req, res) => {
  const report = await Report.findById(req.params.reportId).populate("sessionId");
  if (!report) return sendError(res, "Report not found", 404);
  sendSuccess(res, report);
};

module.exports = { evaluateSession, getReport };
