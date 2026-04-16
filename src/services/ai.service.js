const Groq = require("groq-sdk");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const DOMAIN_PROMPTS = {
  sde: "You are a senior software engineer conducting a technical interview. Ask about data structures, algorithms, system design, and coding best practices. Ask ONE focused question at a time.",
  data_analyst: "You are a data analytics lead. Focus on SQL, Python, statistics, data visualization, and business insights. Ask ONE focused question at a time.",
  hr: "You are an HR manager conducting a behavioural interview. Use the STAR method. Focus on teamwork, leadership, conflict resolution, and culture fit. Ask ONE focused question at a time.",
  marketing: "You are a marketing director. Focus on campaigns, digital marketing, analytics, brand strategy, and growth. Ask ONE focused question at a time.",
  finance: "You are a CFO. Focus on accounting, financial modelling, valuation, and market knowledge. Ask ONE focused question at a time.",
  product: "You are a VP of Product. Focus on product thinking, roadmaps, metrics, user research, and stakeholder management. Ask ONE focused question at a time.",
};

/**
 * getInterviewerResponse — returns AI interviewer text
 * Integrates extraContext for resume-specific data
 */
const getInterviewerResponse = async (domain, language, conversationHistory, extraContext = "") => {
  const basePrompt = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.sde;

  const systemPrompt = `${basePrompt}
${extraContext}

IMPORTANT RULES:
- Respond ONLY in the language the candidate is using.
- Current language code: ${language}
- If language is 'hi' respond in Hindi, 'ta' in Tamil, 'te' in Telugu, etc.
- Be professional, warm, and encouraging.
- Ask ONLY ONE focused question per response.
- Keep responses under 100 words.
- Do NOT repeat questions already asked.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
};

/**
 * transcribeAudio — sends audio buffer to ML STT service
 */
const transcribeAudio = async (audioBuffer, language = "en") => {
  if (!process.env.ML_SERVICE_URL) {
    throw new Error("ML_SERVICE_URL not configured");
  }

  const form = new FormData();
  form.append("audio", audioBuffer, {
    filename: "recording.webm",
    contentType: "audio/webm",
  });
  form.append("language", language);

  const res = await axios.post(`${ML_SERVICE_URL}/stt`, form, {
    headers: form.getHeaders(),
    timeout: 30000,
  });

  return res.data;
};

/**
 * parseResume — converts PDF buffer to Base64 and sends as JSON to ML service
 */
const parseResume = async (pdfBuffer) => {
  if (!process.env.ML_SERVICE_URL) {
    throw new Error("ML_SERVICE_URL not configured");
  }

  // Convert the raw PDF buffer to a Base64 encoded string
  const base64Resume = pdfBuffer.toString("base64");

  // Construct the JSON payload expected by FastAPI
  const payload = {
    resume_base64: base64Resume, 
  };

  const res = await axios.post(`${ML_SERVICE_URL}/parse-resume`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 60000, 
  });

  return res.data;
};

/**
 * generateNextQuestion - Tries ML service first, falls back to Groq
 */
const generateNextQuestion = async (domain, language, history) => {
  try {
    if (process.env.ML_SERVICE_URL) {
      const res = await axios.post(`${ML_SERVICE_URL}/generate-question`, {
        domain,
        language,
        history
      }, {
        timeout: 10000,
      });
      return res.data;
    }
    throw new Error("ML_SERVICE_URL not configured");
  } catch (error) {
    console.warn("ML generated question failed, falling back to Groq:", error.message);
    
    const mappedHistory = history.map((h) => ({
      role: h.role || (h.speaker === "ai" ? "assistant" : "user"),
      content: h.content || h.text || "",
    }));

    const questionText = await getInterviewerResponse(domain, language, mappedHistory);
    return { question: questionText };
  }
};

/**
 * translateText - translates text using Groq
 */
const translateText = async (text, targetLanguage) => {
  const prompt = `Translate the following text into the language represented by the code or name '${targetLanguage}'. 
Return ONLY the translated text, with no additional commentary, quotes, or markdown.
Text to translate: ${text}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "user", content: prompt }
    ],
    max_tokens: 300,
    temperature: 0.3, 
  });

  return completion.choices[0].message.content.trim();
};

module.exports = { 
  getInterviewerResponse, 
  transcribeAudio, 
  parseResume, 
  generateNextQuestion, 
  translateText 
};