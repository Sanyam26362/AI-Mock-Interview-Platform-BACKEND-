const { evaluationQueue } = require("./queue");
const Session = require("../models/Session.model");
const Report = require("../models/Report.model");
const User = require("../models/User.model");
const { generateEvaluation } = require("../services/evaluation.service");

// Process evaluation jobs
evaluationQueue.process(async (job) => {
  const { sessionId, userId } = job.data;

  console.log(`[EvaluationJob] Processing session: ${sessionId}`);

  // 1. Fetch session
  const session = await Session.findById(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  if (session.transcript.length === 0) throw new Error("Empty transcript — cannot evaluate");

  // 2. Generate evaluation via AI
  const evaluation = await generateEvaluation(
    session.transcript,
    session.domain,
    session.language
  );

  // 3. Save report
  const report = await Report.create({
    sessionId: session._id,
    userId,
    ...evaluation,
    language: session.language,
  });

  // 4. Update session with reportId and completed status
  await Session.findByIdAndUpdate(sessionId, {
    reportId: report._id,
    status: "completed",
    completedAt: new Date(),
    duration: session.startedAt
      ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
      : null,
  });

  // 5. Increment user's interview count
  await User.findByIdAndUpdate(userId, { $inc: { interviewsUsed: 1 } });

  console.log(`[EvaluationJob] Report created: ${report._id}`);
  return { reportId: report._id.toString() };
});

// Helper to add a new evaluation job to the queue
const addEvaluationJob = async (sessionId, userId) => {
  const job = await evaluationQueue.add(
    { sessionId, userId },
    { jobId: `eval_${sessionId}` }
  );
  console.log(`[EvaluationJob] Queued job ${job.id} for session ${sessionId}`);
  return job;
};

module.exports = { addEvaluationJob };
