const Groq = require("groq-sdk");
const axios = require("axios");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const DOMAIN_PROMPTS = {
  sde: "You are a senior software engineer conducting a technical interview. Ask about data structures, algorithms, system design, and coding best practices. Ask ONE focused question at a time.",
  data_analyst: "You are a data analytics lead conducting an interview. Focus on SQL, Python, statistics, data visualization, and business insights. Ask ONE focused question at a time.",
  hr: "You are an HR manager conducting a behavioural interview. Use the STAR method. Focus on teamwork, leadership, conflict resolution, and culture fit. Ask ONE focused question at a time.",
  marketing: "You are a marketing director conducting an interview. Focus on campaigns, digital marketing, analytics, brand strategy, and growth. Ask ONE focused question at a time.",
  finance: "You are a CFO conducting a finance interview. Focus on accounting, financial modelling, valuation, and market knowledge. Ask ONE focused question at a time.",
  product: "You are a VP of Product conducting an interview. Focus on product thinking, roadmaps, metrics, user research, and stakeholder management. Ask ONE focused question at a time.",
};

/**
 * getInterviewerResponse — returns AI interviewer text
 */
const getInterviewerResponse = async (domain, language, conversationHistory) => {
  const systemPrompt = `${DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.sde}

IMPORTANT:
- Respond ONLY in the language the candidate is using.
- Current language code: ${language}
- If language is 'hi' respond in Hindi, 'ta' in Tamil, 'te' in Telugu, etc.
- Be professional, warm, and encouraging.
- Ask only ONE question per response.
- Keep responses under 100 words.
- Do not repeat questions already asked.`;

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
 * Called by the voice interview route
 */
const transcribeAudio = async (audioBuffer, language = "en") => {
  if (!process.env.ML_SERVICE_URL) {
    throw new Error("ML_SERVICE_URL not configured");
  }

  const FormData = require("form-data");
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

  return res.data; // { transcript, language_detected, confidence }
};

/**
 * parseResume — sends PDF to ML resume parser
 */
const parseResume = async (pdfBuffer, domain) => {
  if (!process.env.ML_SERVICE_URL) {
    throw new Error("ML_SERVICE_URL not configured");
  }

  const FormData = require("form-data");
  const form = new FormData();
  form.append("resume", pdfBuffer, { filename: "resume.pdf", contentType: "application/pdf" });
  form.append("domain", domain);

  const res = await axios.post(`${ML_SERVICE_URL}/parse-resume`, form, {
    headers: form.getHeaders(),
    timeout: 30000,
  });

  return res.data;
};

const generateNextQuestion = async (domain, language, history) => {
  if (!process.env.ML_SERVICE_URL) {
    throw new Error("ML_SERVICE_URL not configured");
  }

  const res = await axios.post(`${ML_SERVICE_URL}/generate-question`, {
    domain,
    language,
    history
  }, {
    timeout: 30000,
  });

  return res.data; // expects { question: "..." }
};

module.exports = { getInterviewerResponse, transcribeAudio, parseResume, generateNextQuestion };
