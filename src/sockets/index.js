const { Server } = require("socket.io");
const { handleInterviewSocket } = require("./interview.socket");

const initSocket = (server) => {
  // CRITICAL FIX: Add the CORS configuration here so Vercel can connect
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Pass the socket to your interview handler
    handleInterviewSocket(io, socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = { initSocket };