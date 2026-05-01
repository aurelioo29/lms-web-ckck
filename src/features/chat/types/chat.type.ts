export type ChatUser = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
};

export type ChatMessageItem = {
  id: string;
  roomId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: ChatUser;
};

export type ChatRoomResponse = {
  data: {
    room: {
      id: string;
      courseId: string;
      createdAt: string;
    };
    messages: ChatMessageItem[];
    currentUserId: string;
  };
};
