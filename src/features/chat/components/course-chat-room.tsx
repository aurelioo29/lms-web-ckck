"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, Card, Input, message as antdMessage } from "antd";
import { Send } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import type { ChatMessageItem, ChatRoomResponse } from "../types/chat.type";

type CourseChatRoomProps = {
  courseId: string;
};

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "U";
}

export default function CourseChatRoom({ courseId }: CourseChatRoomProps) {
  const [roomId, setRoomId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = input.trim().length > 0 && !!roomId;

  const socketUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
  }, []);

  async function fetchRoom() {
    try {
      setLoading(true);

      const res = await fetch(`/api/chat/rooms/course/${courseId}`, {
        cache: "no-store",
      });

      const json: ChatRoomResponse | { message?: string } = await res.json();

      if (!res.ok) {
        throw new Error(
          "message" in json ? json.message : "Gagal mengambil chat room.",
        );
      }

      const response = json as ChatRoomResponse;

      setRoomId(response.data.room.id);
      setMessages(response.data.messages || []);
      setCurrentUserId(response.data.currentUserId);
    } catch (error) {
      antdMessage.error(
        error instanceof Error ? error.message : "Terjadi error.",
      );
    } finally {
      setLoading(false);
    }
  }

  function sendMessage() {
    if (!socketRef.current || !canSend) return;

    socketRef.current.emit("send_message", {
      roomId,
      userId: currentUserId,
      message: input.trim(),
    });

    setInput("");
  }

  useEffect(() => {
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    if (!roomId) return;

    const socket = io(socketUrl, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.emit("join_room", roomId);

    socket.on("receive_message", (msg: ChatMessageItem) => {
      setMessages((current) => {
        if (current.some((item) => item.id === msg.id)) return current;
        return [...current, msg];
      });
    });

    socket.on("message_error", (payload: { message: string }) => {
      antdMessage.error(payload.message || "Gagal mengirim pesan.");
    });

    return () => {
      socket.emit("leave_room", roomId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, socketUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card
      title="Course Discussion"
      loading={loading}
      className="border border-slate-200"
    >
      <div className="flex h-[420px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Belum ada pesan. Jadilah orang pertama yang bikin keributan
              akademik.
            </div>
          ) : (
            messages.map((item) => {
              const isMine = item.userId === currentUserId;

              return (
                <div
                  key={item.id}
                  className={[
                    "flex gap-2",
                    isMine ? "justify-end" : "justify-start",
                  ].join(" ")}
                >
                  {!isMine ? (
                    <Avatar src={item.user.avatar || undefined}>
                      {getInitial(item.user.name)}
                    </Avatar>
                  ) : null}

                  <div
                    className={[
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      isMine
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-800",
                    ].join(" ")}
                  >
                    {!isMine ? (
                      <p className="m-0 mb-1 text-xs font-semibold text-slate-500">
                        {item.user.name}
                      </p>
                    ) : null}

                    <p className="m-0 whitespace-pre-wrap">{item.message}</p>

                    <p
                      className={[
                        "m-0 mt-1 text-[10px]",
                        isMine ? "text-blue-100" : "text-slate-400",
                      ].join(" ")}
                    >
                      {new Date(item.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex gap-2">
          <Input.TextArea
            rows={1}
            value={input}
            placeholder="Tulis pesan..."
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <Button
            type="primary"
            icon={<Send size={14} />}
            disabled={!canSend}
            onClick={sendMessage}
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}
