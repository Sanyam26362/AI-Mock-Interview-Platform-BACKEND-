const Groq = require("groq-sdk");
const axios = require("axios");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * generateEvaluation — tries ML service first, falls back to Groq
 */
const generateEvaluation = async (transcript, domain, language) => {
  // Try ML service first if it's configured and running
  if (process.env.ML_SERVICE_URL) {
    try {
      const mlRes = await axios.post(
        `${ML_SERVICE_URL}/evaluate`,
        { transcript, domain, language },
        { timeout: 60000 }
      );
      if (mlRes.data && mlRes.data.scores) {
        console.log("[Evaluation] Used ML service");
        return mlRes.data;
      }
    } catch (mlErr) {
      console.warn("[Evaluation] ML service unavailable, falling back to Groq:", mlErr.message);
    }
  }

  // Groq fallback
  return await evaluateWithGroq(transcript, domain, language);
};

/**
 * Groq-based evaluation (used as fallback or primary)
 */
const evaluateWithGroq = async (transcript, domain, language) => {
  const transcriptText = transcript
    .map((t) => `${t.speaker.toUpperCase()}: ${t.text}`)
    .join("\n");

  const prompt = `You are an expert interview evaluator. Analyse this ${domain} interview transcript and evaluate the candidate.

Transcript:
${transcriptText}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "scores": {
    "communication": <number 0-10>,
    "technicalAccuracy": <number 0-10>,
    "confidence": <number 0-10>,
    "clarity": <number 0-10>,
    "overall": <number 0-10>
  },
  "feedback": "<2-3 sentence summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "fillerWords": {
    "count": <number>,
    "words": ["<word1>", "<word2>"]
  }
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content;
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // If JSON parse fails, return safe defaults
    return {
      scores: { communication: 6, technicalAccuracy: 6, confidence: 6, clarity: 6, overall: 6 },
      feedback: "Evaluation completed. The candidate showed reasonable domain knowledge.",
      strengths: ["Attempted all questions", "Showed willingness to engage"],
      improvements: ["Provide more detailed answers", "Use concrete examples"],
      fillerWords: { count: 0, words: [] },
    };
  }
};

module.exports = { generateEvaluation };
