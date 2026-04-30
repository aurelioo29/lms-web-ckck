import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.pointTransaction.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalEarned = await prisma.pointTransaction.aggregate({
    where: {
      userId: session.user.id,
      type: "EARNED",
    },
    _sum: {
      points: true,
    },
  });

  const totalDeducted = await prisma.pointTransaction.aggregate({
    where: {
      userId: session.user.id,
      type: "DEDUCTED",
    },
    _sum: {
      points: true,
    },
  });

  const totalPoints =
    (totalEarned._sum.points || 0) - (totalDeducted._sum.points || 0);

  return NextResponse.json({
    data: transactions,
    summary: {
      totalPoints,
      totalEarned: totalEarned._sum.points || 0,
      totalDeducted: totalDeducted._sum.points || 0,
    },
  });
}
