const mongoose = require("mongoose");
const Question = require("../src/models/Question.model");
require("dotenv").config();

const questions = [
  { domain: "sde", difficulty: "easy", question: "What is the difference between == and === in JavaScript?", tags: ["javascript", "basics"] },
  { domain: "sde", difficulty: "medium", question: "Explain the concept of Big O notation with examples.", tags: ["algorithms", "complexity"] },
  { domain: "sde", difficulty: "hard", question: "Design a URL shortener system like bit.ly. Discuss the architecture.", tags: ["system-design"] },
  { domain: "data_analyst", difficulty: "easy", question: "What is the difference between INNER JOIN and LEFT JOIN?", tags: ["sql"] },
  { domain: "data_analyst", difficulty: "medium", question: "Explain the concept of p-value in hypothesis testing.", tags: ["statistics"] },
  { domain: "hr", difficulty: "easy", question: "Tell me about a time you handled a conflict at work.", tags: ["behavioral"] },
  { domain: "hr", difficulty: "medium", question: "Describe a situation where you had to lead a team under pressure.", tags: ["leadership"] },
  { domain: "marketing", difficulty: "easy", question: "What is the difference between SEO and SEM?", tags: ["digital-marketing"] },
  { domain: "finance", difficulty: "medium", question: "What is DCF analysis and when would you use it?", tags: ["valuation"] },
  { domain: "product", difficulty: "medium", question: "How would you prioritize features for a new product launch?", tags: ["product-thinking"] },
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await Question.insertMany(questions);
  console.log(`Seeded ${questions.length} questions`);
  process.exit(0);
}).catch(console.error);
