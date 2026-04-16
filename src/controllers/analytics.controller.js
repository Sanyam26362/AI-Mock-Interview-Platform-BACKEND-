const Report = require("../models/Report.model");
const Session = require("../models/Session.model");
const { sendSuccess, sendError } = require("../utils/response");

/**
 * GET /api/v1/analytics/overview
 * Returns overall stats + score averages across all sessions
 */
const getOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    const reports = await Report.find({ userId }).sort({ createdAt: -1 });

    if (reports.length === 0) {
      return sendSuccess(res, {
        totalInterviews: 0,
        averageScores: null,
        bestScore: null,
        recentTrend: [],
        topStrengths: [],
        topWeaknesses: [],
      });
    }

    // Average scores across all reports
    const avg = (key) =>
      +(reports.reduce((s, r) => s + (r.scores[key] || 0), 0) / reports.length).toFixed(1);

    const averageScores = {
      communication: avg("communication"),
      technicalAccuracy: avg("technicalAccuracy"),
      confidence: avg("confidence"),
      clarity: avg("clarity"),
      overall: avg("overall"),
    };

    // Best overall score
    const bestScore = Math.max(...reports.map((r) => r.scores.overall));

    // Recent trend — last 8 sessions, overall score + date
    const recentTrend = reports.slice(0, 8).reverse().map((r, i) => ({
      session: i + 1,
      score: r.scores.overall,
      date: r.createdAt,
      domain: r.sessionId?.domain || "—",
    }));

    // Aggregate strengths and weaknesses across all reports
    const strengthCount = {};
    const weaknessCount = {};

    reports.forEach((r) => {
      (r.strengths || []).forEach((s) => {
        strengthCount[s] = (strengthCount[s] || 0) + 1;
      });
      (r.improvements || []).forEach((w) => {
        weaknessCount[w] = (weaknessCount[w] || 0) + 1;
      });
    });

    const topStrengths = Object.entries(strengthCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    const topWeaknesses = Object.entries(weaknessCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    sendSuccess(res, {
      totalInterviews: reports.length,
      averageScores,
      bestScore,
      recentTrend,
      topStrengths,
      topWeaknesses,
    });
  } catch (err) {
    console.error("[Analytics] Overview error:", err.message);
    sendError(res, "Failed to fetch analytics", 500);
  }
};

/**
 * GET /api/v1/analytics/by-domain
 * Returns performance breakdown per domain
 */
const getByDomain = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({ userId, status: "completed" }).lean();
    const sessionMap = {};
    sessions.forEach((s) => { sessionMap[s._id.toString()] = s; });

    const reports = await Report.find({ userId }).lean();

    const domainMap = {};

    reports.forEach((r) => {
      const session = sessionMap[r.sessionId?.toString()];
      const domain = session?.domain || "unknown";

      if (!domainMap[domain]) {
        domainMap[domain] = {
          domain,
          count: 0,
          scores: { communication: 0, technicalAccuracy: 0, confidence: 0, clarity: 0, overall: 0 },
          strengths: {},
          weaknesses: {},
          trend: [],
        };
      }

      const d = domainMap[domain];
      d.count += 1;
      d.scores.communication += r.scores.communication || 0;
      d.scores.technicalAccuracy += r.scores.technicalAccuracy || 0;
      d.scores.confidence += r.scores.confidence || 0;
      d.scores.clarity += r.scores.clarity || 0;
      d.scores.overall += r.scores.overall || 0;
      d.trend.push({ score: r.scores.overall, date: r.createdAt });

      (r.strengths || []).forEach((s) => { d.strengths[s] = (d.strengths[s] || 0) + 1; });
      (r.improvements || []).forEach((w) => { d.weaknesses[w] = (d.weaknesses[w] || 0) + 1; });
    });

    const result = Object.values(domainMap).map((d) => ({
      domain: d.domain,
      count: d.count,
      averageScores: {
        communication: +(d.scores.communication / d.count).toFixed(1),
        technicalAccuracy: +(d.scores.technicalAccuracy / d.count).toFixed(1),
        confidence: +(d.scores.confidence / d.count).toFixed(1),
        clarity: +(d.scores.clarity / d.count).toFixed(1),
        overall: +(d.scores.overall / d.count).toFixed(1),
      },
      topStrengths: Object.entries(d.strengths).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([text, count]) => ({ text, count })),
      topWeaknesses: Object.entries(d.weaknesses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([text, count]) => ({ text, count })),
      trend: d.trend.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-6),
    }));

    sendSuccess(res, result);
  } catch (err) {
    console.error("[Analytics] By-domain error:", err.message);
    sendError(res, "Failed to fetch domain analytics", 500);
  }
};

/**
 * GET /api/v1/analytics/weekly
 * Returns week-by-week progress for the last 8 weeks
 */
const getWeeklyProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const weeks = [];

    for (let i = 7; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const reports = await Report.find({
        userId,
        createdAt: { $gte: start, $lt: end },
      });

      const count = reports.length;
      const avgScore =
        count > 0
          ? +(reports.reduce((s, r) => s + r.scores.overall, 0) / count).toFixed(1)
          : null;

      weeks.push({
        week: `W${8 - i}`,
        startDate: start,
        count,
        avgScore,
      });
    }

    sendSuccess(res, weeks);
  } catch (err) {
    sendError(res, "Failed to fetch weekly data", 500);
  }
};

/**
 * GET /api/v1/analytics/reports?domain=sde&limit=20&page=1
 * Paginated list of all reports with optional domain filter
 */
const getReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const { domain, limit = 10, page = 1 } = req.query;

    // Get sessions filtered by domain if needed
    let sessionIds;
    if (domain) {
      const sessions = await Session.find({ userId, domain }).select("_id").lean();
      sessionIds = sessions.map((s) => s._id);
    }

    const filter = { userId };
    if (sessionIds) filter.sessionId = { $in: sessionIds };

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("sessionId", "domain language mode createdAt")
      .lean();

    sendSuccess(res, { reports, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    sendError(res, "Failed to fetch reports", 500);
  }
};

module.exports = { getOverview, getByDomain, getWeeklyProgress, getReports };
