const { generateNextQuestion, translateText, getInterviewerResponse } = require("../services/ai.service");
const Session = require("../models/Session.model");

const handleInterviewSocket = (io, socket) => {
  // Helper to track room occupancy
  const getRoomSize = (sessionId) => {
    const room = io.sockets.adapter.rooms.get(sessionId);
    return room ? room.size : 0;
  };

  // ─── Session Join ────────────────────────────────────────────────────────
  socket.on("join_session", ({ sessionId }) => {
    socket.join(sessionId);
    socket.emit("session_joined", { sessionId });

    const roomSize = getRoomSize(sessionId);
    io.to(sessionId).emit("room_size", { size: roomSize });

    if (roomSize === 2) {
      socket.to(sessionId).emit("peer_joined", { peerId: socket.id });
    }
  });

  // ─── Disconnect ──────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    socket.rooms.forEach((sessionId) => {
      socket.to(sessionId).emit("peer_left");
    });
  });

  // ─── Core Interview Flow (Merged with Resume Logic) ──────────────────────
  socket.on("user_message", async ({ sessionId, message, domain, language, history }) => {
    try {
      // 1. Fetch Session for Resume Data (Claude's addition)
      const session = await Session.findById(sessionId).lean();
      let extraContext = "";

      if (session?.resumeData?.suggestedQuestions?.length > 0) {
        const askedCount = (history || []).filter(h => h.role === "assistant" || h.speaker === "ai").length;
        const { skills, previousRoles, experienceYears, suggestedQuestions } = session.resumeData;

        extraContext = `
This is a RESUME-BASED interview. The candidate's resume shows:
- Skills: ${skills?.join(", ") || "N/A"}
- Previous roles: ${previousRoles?.join(", ") || "N/A"}
- Experience: ${experienceYears} years

Suggested questions tailored to their resume:
${suggestedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

You have asked ${askedCount} questions so far. Ask question ${askedCount + 1} from the list if available, or generate a deep-dive follow-up based on their specific resume details.`;
      }

      // 2. Map History for AI service
      const mappedHistory = history.map((h) => ({
        role: h.role || (h.speaker === "ai" ? "assistant" : "user"),
        content: h.content || h.text || "",
      }));
      mappedHistory.push({ role: "user", content: message });

      // 3. Get AI Response 
      // Note: We use getInterviewerResponse directly here to support the 'extraContext' parameter
      const aiResponse = await getInterviewerResponse(domain, language, mappedHistory, extraContext);

      io.to(sessionId).emit("ai_response", {
        text: aiResponse,
        sessionId,
      });
    } catch (err) {
      console.error("AI response failed:", err);
      socket.emit("error", { message: "AI response failed" });
    }
  });

  // ─── Live Peer Chat ──────────────────────────────────────────────────────
  socket.on("peer_message", ({ sessionId, message }) => {
    socket.to(sessionId).emit("peer_message", { message });
  });

  // ─── Real-time Translation ───────────────────────────────────────────────
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

  // ─── WebRTC Signaling ────────────────────────────────────────────────────
  socket.on("webrtc_offer", ({ sessionId, offer }) => {
    socket.to(sessionId).emit("webrtc_offer", { offer, from: socket.id });
  });

  socket.on("webrtc_answer", ({ sessionId, answer }) => {
    socket.to(sessionId).emit("webrtc_answer", { answer, from: socket.id });
  });

  socket.on("webrtc_ice_candidate", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("webrtc_ice_candidate", { candidate, from: socket.id });
  });

  // ─── Collaborative Code Editor ──────────────────────────────────────────
  socket.on("code_change", ({ sessionId, code, language }) => {
    socket.to(sessionId).emit("code_change", { code, language, from: socket.id });
  });

  socket.on("code_language_change", ({ sessionId, language }) => {
    socket.to(sessionId).emit("code_language_change", { language, from: socket.id });
  });

  socket.on("code_run_result", ({ sessionId, output, error }) => {
    io.to(sessionId).emit("code_run_result", { output, error });
  });
};

module.exports = { handleInterviewSocket };