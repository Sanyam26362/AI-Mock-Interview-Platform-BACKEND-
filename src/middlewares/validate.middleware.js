const Joi = require("joi");

// Generic validator factory — wrap any Joi schema
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });

    if (error) {
      const errors = error.details.map((d) => d.message.replace(/['"]/g, ""));
      return res.status(422).json({ success: false, message: "Validation failed", errors });
    }

    req[property] = value; // replace with sanitized value
    next();
  };
};

// ─── Schemas ──────────────────────────────────────────────

const schemas = {
  // User
  updateProfile: Joi.object({
    firstName: Joi.string().min(1).max(50),
    lastName: Joi.string().min(1).max(50),
    preferredLanguage: Joi.string().valid("en","hi","ta","te","bn","mr","gu","kn","ml"),
    domain: Joi.string().valid("sde","data_analyst","hr","marketing","finance","product"),
  }),

  // Session
  createSession: Joi.object({
    domain: Joi.string().valid("sde","data_analyst","hr","marketing","finance","product").required(),
    language: Joi.string().valid("en","hi","ta","te","bn","mr","gu","kn","ml").default("en"),
    mode: Joi.string().valid("text","voice","live").default("text"),
  }),

  addTurn: Joi.object({
    speaker: Joi.string().valid("ai","user").required(),
    text: Joi.string().min(1).max(5000).required(),
    language: Joi.string().default("en"),
    audioUrl: Joi.string().uri().optional(),
  }),

  // Questions
  createQuestion: Joi.object({
    domain: Joi.string().valid("sde","data_analyst","hr","marketing","finance","product").required(),
    difficulty: Joi.string().valid("easy","medium","hard").default("medium"),
    question: Joi.string().min(10).max(1000).required(),
    sampleAnswer: Joi.string().max(3000).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    language: Joi.string().default("en"),
  }),

  // Query params for questions
  getQuestions: Joi.object({
    domain: Joi.string().valid("sde","data_analyst","hr","marketing","finance","product"),
    difficulty: Joi.string().valid("easy","medium","hard"),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),
};

module.exports = { validate, schemas };
