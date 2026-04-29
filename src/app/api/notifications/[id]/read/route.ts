import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: RouteProps) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!notification) {
    return NextResponse.json(
      { message: "Notification tidak ditemukan." },
      { status: 404 },
    );
  }

  const updated = await prisma.notification.update({
    where: {
      id,
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({
    message: "Notification berhasil ditandai sudah dibaca.",
    data: updated,
  });
}
