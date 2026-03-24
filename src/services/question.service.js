const Question = require("../models/Question.model");
const { getInterviewerResponse } = require("./ai.service");

/**
 * Fetch random questions from DB by domain + difficulty
 */
const getRandomQuestions = async ({ domain, difficulty, limit = 10, language = "en" }) => {
  const filter = { isActive: true };
  if (domain) filter.domain = domain;
  if (difficulty) filter.difficulty = difficulty;

  // language fallback: try exact match first, fall back to "en"
  const exact = await Question.aggregate([
    { $match: { ...filter, language } },
    { $sample: { size: Number(limit) } },
  ]);

  if (exact.length >= limit) return exact;

  // fallback to English questions
  const fallback = await Question.aggregate([
    { $match: { ...filter, language: "en" } },
    { $sample: { size: Number(limit) - exact.length } },
  ]);

  return [...exact, ...fallback];
};

/**
 * Generate AI-powered questions from a resume text + domain
 * Used in Phase 4 (resume-based interview)
 */
const generateQuestionsFromResume = async (resumeText, domain, language = "en", count = 5) => {
  const prompt = `Based on this resume, generate ${count} targeted interview questions for a ${domain} role.
  
Resume:
${resumeText.slice(0, 2000)}

Return ONLY a JSON array of strings. Example: ["Question 1?", "Question 2?"]`;

  const response = await getInterviewerResponse(domain, language, [
    { role: "user", content: prompt },
  ]);

  try {
    const cleaned = response.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // fallback: split by newline if JSON parse fails
    return response
      .split("\n")
      .filter((line) => line.trim().endsWith("?"))
      .slice(0, count);
  }
};

/**
 * Get question count breakdown by domain
 */
const getQuestionStats = async () => {
  return await Question.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: { domain: "$domain", difficulty: "$difficulty" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.domain": 1 } },
  ]);
};

/**
 * Soft-delete a question
 */
const deactivateQuestion = async (questionId) => {
  return await Question.findByIdAndUpdate(questionId, { isActive: false }, { new: true });
};

module.exports = {
  getRandomQuestions,
  generateQuestionsFromResume,
  getQuestionStats,
  deactivateQuestion,
};
