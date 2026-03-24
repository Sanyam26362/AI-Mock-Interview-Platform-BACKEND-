const { getInterviewerResponse } = require("../services/ai.service");

const handleInterviewSocket = (io, socket) => {
  socket.on("join_session", ({ sessionId }) => {
    socket.join(sessionId);
    socket.emit("session_joined", { sessionId });
  });

  socket.on("user_message", async ({ sessionId, message, domain, language, history }) => {
    try {
      const aiResponse = await getInterviewerResponse(domain, language, [
        ...history,
        { role: "user", content: message },
      ]);
      io.to(sessionId).emit("ai_response", { text: aiResponse, sessionId });
    } catch (err) {
      socket.emit("error", { message: "AI response failed" });
    }
  });
};

module.exports = { handleInterviewSocket };
