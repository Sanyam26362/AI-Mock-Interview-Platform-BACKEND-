const { generateNextQuestion } = require("../services/ai.service");

const handleInterviewSocket = (io, socket) => {
  socket.on("join_session", ({ sessionId }) => {
    socket.join(sessionId);
    socket.emit("session_joined", { sessionId });
  });

  socket.on("user_message", async ({ sessionId, message, domain, language, history }) => {
    try {
      const mappedHistory = history.map((h) => ({
        speaker: h.role === "assistant" || h.speaker === "ai" ? "ai" : "user",
        text: h.content || h.text,
      }));
      mappedHistory.push({ speaker: "user", text: message });

      const response = await generateNextQuestion(domain, language, mappedHistory);
      io.to(sessionId).emit("ai_response", { text: response.question, sessionId });
    } catch (err) {
      console.error("AI response failed:", err);
      socket.emit("error", { message: "AI response failed" });
    }
  });
};

module.exports = { handleInterviewSocket };
