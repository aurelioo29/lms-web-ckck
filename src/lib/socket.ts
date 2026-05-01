import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { prisma } from "@/lib/prisma";

type ServerWithSocket = HTTPServer & {
  io?: SocketIOServer;
};

type JoinRoomPayload = string;

type SendMessagePayload = {
  roomId: string;
  userId: string;
  message: string;
};

let io: SocketIOServer | undefined;

export function initSocket(server: ServerWithSocket) {
  if (server.io) {
    io = server.io;
    return server.io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  server.io = io;

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (roomId: JoinRoomPayload) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", async (data: SendMessagePayload) => {
      try {
        const { roomId, userId, message } = data;

        if (!roomId || !userId || !message?.trim()) {
          return;
        }

        const saved = await prisma.chatMessage.create({
          data: {
            roomId,
            userId,
            message: message.trim(),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        });

        io?.to(roomId).emit("receive_message", saved);
      } catch (error) {
        console.error("Socket send_message error:", error);

        socket.emit("message_error", {
          message: "Gagal mengirim pesan.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO belum diinisialisasi.");
  }

  return io;
}
