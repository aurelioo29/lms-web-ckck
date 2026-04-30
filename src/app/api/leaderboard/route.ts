import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      pointTransactions: {
        select: {
          type: true,
          points: true,
        },
      },
    },
  });

  const leaderboard = users
    .map((user) => {
      const totalPoints = user.pointTransactions.reduce((sum, trx) => {
        if (trx.type === "EARNED") return sum + trx.points;
        return sum - trx.points;
      }, 0);

      return {
        userId: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        totalPoints,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  const myRank =
    leaderboard.find((item) => item.userId === session.user.id) || null;

  return NextResponse.json({
    data: leaderboard,
    myRank,
  });
}
