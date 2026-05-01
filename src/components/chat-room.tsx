"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

export default function ChatRoom({
  courseId,
  user,
}: {
  courseId: string;
  user: { id: string; name: string };
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const roomId = `course:${courseId}`;

  useEffect(() => {
    socket.emit("join_room", roomId);

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  function sendMessage() {
    if (!input) return;

    socket.emit("send_message", {
      roomId,
      userId: user.id,
      message: input,
    });

    setInput("");
  }

  return (
    <div className="rounded border p-4">
      <div className="h-64 overflow-auto border p-2 mb-2">
        {messages.map((m) => (
          <div key={m.id}>
            <b>{m.user.name}:</b> {m.message}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border px-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}