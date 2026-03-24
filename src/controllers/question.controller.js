const Question = require("../models/Question.model");
const { sendSuccess } = require("../utils/response");

const getQuestions = async (req, res) => {
  const { domain, difficulty, limit = 10 } = req.query;
  const filter = { isActive: true };
  if (domain) filter.domain = domain;
  if (difficulty) filter.difficulty = difficulty;
  const questions = await Question.aggregate([{ $match: filter }, { $sample: { size: Number(limit) } }]);
  sendSuccess(res, questions, "Questions fetched");
};

const createQuestion = async (req, res) => {
  const q = await Question.create(req.body);
  sendSuccess(res, q, "Question created", 201);
};

module.exports = { getQuestions, createQuestion };
