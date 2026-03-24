const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateEvaluation = async (transcript, domain, language) => {
  const transcriptText = transcript.map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join("\n");

  const prompt = `You are an expert interview evaluator. Evaluate the following interview transcript for a ${domain} role.
Transcript:
${transcriptText}

Return ONLY a valid JSON object with this exact structure:
{
  "scores": {
    "communication": <0-10>,
    "technicalAccuracy": <0-10>,
    "confidence": <0-10>,
    "clarity": <0-10>,
    "overall": <0-10>
  },
  "feedback": "<2-3 sentence overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "fillerWords": { "count": <number>, "words": ["<word>"] }
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800,
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content;
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
};

module.exports = { generateEvaluation };
