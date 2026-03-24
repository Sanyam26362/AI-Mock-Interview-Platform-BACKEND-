const User = require("../models/User.model");
const Session = require("../models/Session.model");
const { sendSuccess, sendError } = require("../utils/response");

const getMe = async (req, res) => {
  sendSuccess(res, req.user, "User fetched");
};

const updateMe = async (req, res) => {
  const { preferredLanguage, domain, firstName, lastName } = req.body;
  const updated = await User.findByIdAndUpdate(req.user._id, { preferredLanguage, domain, firstName, lastName }, { new: true });
  sendSuccess(res, updated, "Profile updated");
};

const getMyStats = async (req, res) => {
  const sessions = await Session.find({ userId: req.user._id, status: "completed" }).countDocuments();
  sendSuccess(res, { totalInterviews: sessions, streak: req.user.streak, plan: req.user.plan }, "Stats fetched");
};

module.exports = { getMe, updateMe, getMyStats };
