export type PointTransactionItem = {
  id: string;
  userId: string;
  type: "EARNED" | "DEDUCTED";
  points: number;
  source: string;
  description: string | null;
  metadata: unknown;
  createdAt: string;
};

export type LeaderboardItem = {
  userId: string;
  name: string;
  username: string;
  avatar: string | null;
  totalPoints: number;
  rank: number;
};
