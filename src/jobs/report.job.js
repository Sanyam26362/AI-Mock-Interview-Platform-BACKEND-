const { reportQueue } = require("./queue");
const Report = require("../models/Report.model");
const Session = require("../models/Session.model");
const User = require("../models/User.model");

// Process report jobs (e.g. email sending, PDF generation in future)
reportQueue.process(async (job) => {
  const { reportId, userId } = job.data;

  console.log(`[ReportJob] Processing report: ${reportId}`);

  const report = await Report.findById(reportId).populate("sessionId");
  if (!report) throw new Error(`Report ${reportId} not found`);

  const user = await User.findById(userId);
  if (!user) throw new Error(`User ${userId} not found`);

  // --- Future: Send email with report summary ---
  // await emailService.sendReportEmail(user.email, report);

  // --- Future: Generate PDF report ---
  // await pdfService.generateReport(report);

  // --- Update streak logic ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = user.lastActive ? new Date(user.lastActive) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);

  const isYesterday =
    lastActive &&
    today.getTime() - lastActive.getTime() === 86400000;

  const isToday = lastActive && today.getTime() === lastActive.getTime();

  let newStreak = user.streak;
  if (isYesterday) newStreak += 1;
  else if (!isToday) newStreak = 1; // reset streak if missed a day

  await User.findByIdAndUpdate(userId, {
    streak: newStreak,
    lastActive: new Date(),
  });

  console.log(`[ReportJob] Streak updated to ${newStreak} for user ${userId}`);
  return { reportId, streak: newStreak };
});

// Helper to add a report job
const addReportJob = async (reportId, userId) => {
  const job = await reportQueue.add(
    { reportId, userId },
    { jobId: `report_${reportId}` }
  );
  console.log(`[ReportJob] Queued job ${job.id} for report ${reportId}`);
  return job;
};

module.exports = { addReportJob };
