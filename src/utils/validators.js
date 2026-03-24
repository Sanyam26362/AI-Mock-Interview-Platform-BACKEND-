const Joi = require("joi");

const VALID_DOMAINS = ["sde", "data_analyst", "hr", "marketing", "finance", "product"];
const VALID_LANGUAGES = ["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

// ─── Reusable field definitions ────────────────────────────
const fields = {
  domain: Joi.string().valid(...VALID_DOMAINS),
  language: Joi.string().valid(...VALID_LANGUAGES).default("en"),
  difficulty: Joi.string().valid(...VALID_DIFFICULTIES),
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/, "MongoDB ObjectId"),
};

// ─── Request body schemas ──────────────────────────────────

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).trim(),
  lastName: Joi.string().min(1).max(50).trim(),
  preferredLanguage: fields.language,
  domain: fields.domain,
});

const createSessionSchema = Joi.object({
  domain: fields.domain.required(),
  language: fields.language,
  mode: Joi.string().valid("text", "voice", "live").default("text"),
});

const addTurnSchema = Joi.object({
  speaker: Joi.string().valid("ai", "user").required(),
  text: Joi.string().min(1).max(5000).trim().required(),
  language: fields.language,
  audioUrl: Joi.string().uri().optional().allow(""),
});

const createQuestionSchema = Joi.object({
  domain: fields.domain.required(),
  difficulty: fields.difficulty.default("medium"),
  question: Joi.string().min(10).max(1000).trim().required(),
  sampleAnswer: Joi.string().max(3000).trim().optional().allow(""),
  tags: Joi.array().items(Joi.string().trim().lowercase()).max(10).optional(),
  language: fields.language,
});

// ─── Query param schemas ───────────────────────────────────

const getQuestionsQuerySchema = Joi.object({
  domain: fields.domain.optional(),
  difficulty: fields.difficulty.optional(),
  limit: Joi.number().integer().min(1).max(50).default(10),
  language: fields.language.optional(),
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ─── Param schemas ─────────────────────────────────────────

const objectIdParamSchema = Joi.object({
  id: fields.objectId.required(),
});

const sessionIdParamSchema = Joi.object({
  sessionId: fields.objectId.required(),
});

// ─── Standalone validation helper ─────────────────────────
// Use this inside service functions when you need to validate outside middleware
const validateData = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map((d) => d.message.replace(/['"]/g, ""));
    throw new Error(`Validation error: ${messages.join(", ")}`);
  }
  return value;
};

module.exports = {
  updateProfileSchema,
  createSessionSchema,
  addTurnSchema,
  createQuestionSchema,
  getQuestionsQuerySchema,
  paginationSchema,
  objectIdParamSchema,
  sessionIdParamSchema,
  validateData,
  VALID_DOMAINS,
  VALID_LANGUAGES,
  VALID_DIFFICULTIES,
};
