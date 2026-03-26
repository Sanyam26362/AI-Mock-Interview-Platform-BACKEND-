const { transcribeAudio } = require("../services/ai.service");
const { sendSuccess, sendError } = require("../utils/response");

/**
 * POST /api/v1/voice/transcribe
 * Receives audio file, returns transcript via Whisper (ML service)
 */
const transcribeVoice = async (req, res) => {
  try {
    if (!req.file) return sendError(res, "No audio file provided", 400);

    const language = req.body.language || "en";
    const result = await transcribeAudio(req.file.buffer, language);

    sendSuccess(res, result, "Transcription successful");
  } catch (err) {
    console.error("[VoiceController] STT error:", err.message);
    sendError(res, "Speech transcription failed: " + err.message, 500);
  }
};

module.exports = { transcribeVoice };
