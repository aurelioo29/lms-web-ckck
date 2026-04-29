import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { createNotification } from "@/lib/notification";
import { getRequestMeta } from "@/lib/request";

const declineSchema = z.object({
  note: z.string().optional(),
});

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, { params }: RouteProps) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "user_approvals.decline")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const payload = declineSchema.parse(body);
  const { ipAddress, userAgent } = await getRequestMeta();

  const approval = await prisma.userApproval.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!approval) {
    return NextResponse.json(
      { message: "Approval request tidak ditemukan." },
      { status: 404 },
    );
  }

  if (approval.status !== "PENDING") {
    return NextResponse.json(
      { message: "Approval request sudah diproses." },
      { status: 400 },
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: approval.userId },
      data: {
        status: "DECLINED",
      },
    });

    await tx.userApproval.update({
      where: { id },
      data: {
        status: "DECLINED",
        note: payload.note,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    return updatedUser;
  });

  await createActivityLog({
    userId: session.user.id,
    action: "DECLINE_USER",
    module: "user_approvals",
    description: `${session.user.name} menolak akun ${approval.user.name}.`,
    ipAddress,
    userAgent,
    oldData: {
      userId: approval.userId,
      status: approval.user.status,
      approvalStatus: approval.status,
    },
    newData: {
      userId: approval.userId,
      status: "DECLINED",
      approvalStatus: "DECLINED",
      note: payload.note ?? null,
    },
    metadata: {
      declinedUserId: approval.userId,
      declinedUsername: approval.user.username,
    },
  });

  await createNotification({
    userId: approval.userId,
    title: "Pendaftaran Ditolak",
    message: payload.note
      ? `Pendaftaran akun Anda ditolak. Catatan: ${payload.note}`
      : "Pendaftaran akun Anda ditolak.",
    type: "error",
    link: "/login",
  });

  return NextResponse.json({
    message: "User berhasil ditolak.",
    data: result,
  });
}
