const Session = require("../models/Session.model");
const { sendSuccess, sendError } = require("../utils/response");

const createSession = async (req, res) => {
  const { domain, language, mode } = req.body;
  const session = await Session.create({ userId: req.user._id, clerkId: req.user.clerkId, domain, language, mode });
  sendSuccess(res, session, "Session created", 201);
};

const getSessions = async (req, res) => {
  const sessions = await Session.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
  sendSuccess(res, sessions, "Sessions fetched");
};

const getSession = async (req, res) => {
  const session = await Session.findById(req.params.id).populate("reportId");
  if (!session) return sendError(res, "Session not found", 404);
  sendSuccess(res, session);
};

const addTurn = async (req, res) => {
  const { speaker, text, language } = req.body;
  const session = await Session.findByIdAndUpdate(req.params.id,
    { $push: { transcript: { speaker, text, language } } }, { new: true });
  sendSuccess(res, session, "Turn added");
};

const completeSession = async (req, res) => {
  const session = await Session.findByIdAndUpdate(req.params.id,
    { status: "completed", completedAt: new Date() }, { new: true });
  sendSuccess(res, session, "Session completed");
};

module.exports = { createSession, getSessions, getSession, addTurn, completeSession };
