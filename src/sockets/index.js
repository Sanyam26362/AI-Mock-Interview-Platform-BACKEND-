const { Server } = require("socket.io");
const { handleInterviewSocket } = require("./interview.socket");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    handleInterviewSocket(io, socket);
    socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
  });

  return io;
};

module.exports = { initSocket };
