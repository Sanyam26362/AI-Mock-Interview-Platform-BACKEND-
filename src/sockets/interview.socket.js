const { generateNextQuestion, translateText } = require("../services/ai.service");

const handleInterviewSocket = (io, socket) => {
  // Track how many people are in each session room
  const getRoomSize = (sessionId) => {
    const room = io.sockets.adapter.rooms.get(sessionId);
    return room ? room.size : 0;
  };

  socket.on("join_session", ({ sessionId }) => {
    socket.join(sessionId);
    socket.emit("session_joined", { sessionId });

    // ✅ NEW: Tell everyone in the room how many peers are present
    const roomSize = getRoomSize(sessionId);
    io.to(sessionId).emit("room_size", { size: roomSize });

    // ✅ NEW: If 2 people are now in the room, tell the FIRST person to start the call
    // We notify the *other* person (not the one who just joined) to initiate the offer
    if (roomSize === 2) {
      socket.to(sessionId).emit("peer_joined", { peerId: socket.id });
    }
  });

  socket.on("disconnect", () => {
    // Notify all rooms this socket was in
    socket.rooms.forEach((sessionId) => {
      socket.to(sessionId).emit("peer_left");
    });
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

  // --- Live Peer Chat ---
  socket.on("peer_message", ({ sessionId, message }) => {
    socket.to(sessionId).emit("peer_message", { message });
  });

  // --- Real-time Translation ---
  socket.on("translate_message", async ({ sessionId, text, targetLanguage }) => {
    try {
      const translated = await translateText(text, targetLanguage);
      io.to(sessionId).emit("translation_result", {
        original: text,
        translated,
        targetLanguage,
        from: socket.id,
      });
    } catch (err) {
      console.error("Translation failed:", err);
      socket.emit("error", { message: "Translation failed" });
    }
  });

  // --- WebRTC Signaling ---
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