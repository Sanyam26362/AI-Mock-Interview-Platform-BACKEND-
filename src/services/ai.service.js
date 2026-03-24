const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const DOMAIN_PROMPTS = {
  sde: "You are a senior software engineer conducting a technical interview. Ask about data structures, algorithms, system design, and coding best practices.",
  data_analyst: "You are a data analytics lead conducting an interview. Focus on SQL, Python, statistics, data visualization, and business insight.",
  hr: "You are an HR manager conducting a behavioral interview. Focus on situational questions, teamwork, leadership, and culture fit.",
  marketing: "You are a marketing director conducting an interview. Focus on campaigns, analytics, brand strategy, and digital marketing.",
  finance: "You are a CFO conducting a finance interview. Focus on accounting, financial modeling, valuation, and market knowledge.",
  product: "You are a VP of Product conducting an interview. Focus on product thinking, roadmaps, metrics, and stakeholder management.",
};

const getInterviewerResponse = async (domain, language, conversationHistory) => {
  const systemPrompt = `${DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.sde}
You MUST respond in the same language as the candidate. 
Current language: ${language}.
Keep questions concise. Ask ONE question at a time. Be professional but encouraging.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: systemPrompt }, ...conversationHistory],
    max_tokens: 300,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
};

module.exports = { getInterviewerResponse };
