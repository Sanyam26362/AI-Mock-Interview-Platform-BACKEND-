const Bull = require("bull");
require("dotenv").config();

// Create queues
const evaluationQueue = new Bull("evaluation", {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const reportQueue = new Bull("report", {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 3000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Queue event listeners
evaluationQueue.on("completed", (job) => {
  console.log(`[EvaluationQueue] Job ${job.id} completed`);
});
evaluationQueue.on("failed", (job, err) => {
  console.error(`[EvaluationQueue] Job ${job.id} failed:`, err.message);
});

reportQueue.on("completed", (job) => {
  console.log(`[ReportQueue] Job ${job.id} completed`);
});
reportQueue.on("failed", (job, err) => {
  console.error(`[ReportQueue] Job ${job.id} failed:`, err.message);
});

module.exports = { evaluationQueue, reportQueue };
