const { generateNextQuestion, translateText } = require("../services/ai.service");

const handleInterviewSocket = (io, socket) => {
  socket.on("join_session", ({ sessionId }) => {
    socket.join(sessionId);
    socket.emit("session_joined", { sessionId });
  });

  // --- Core Interview Flow ---
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

  // --- Real-time Translation (Phase 3) ---
  socket.on("translate_message", async ({ sessionId, text, targetLanguage }) => {
    try {
      const translated = await translateText(text, targetLanguage);
      io.to(sessionId).emit("translation_result", { 
        original: text, 
        translated, 
        targetLanguage,
        from: socket.id 
      });
    } catch (err) {
      console.error("Translation failed:", err);
      socket.emit("error", { message: "Translation failed" });
    }
  });

  // --- WebRTC Signaling (Phase 3) ---
  socket.on("webrtc_offer", ({ sessionId, offer }) => {
    socket.to(sessionId).emit("webrtc_offer", { offer, from: socket.id });
  });

  socket.on("webrtc_answer", ({ sessionId, answer }) => {
    socket.to(sessionId).emit("webrtc_answer", { answer, from: socket.id });
  });

  socket.on("webrtc_ice_candidate", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("webrtc_ice_candidate", { candidate, from: socket.id });
  });
};

module.exports = { handleInterviewSocket };
