import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { createNotification } from "@/lib/notification";
import { getRequestMeta } from "@/lib/request";
import { getStringSetting } from "@/lib/settings";

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

  if (!hasPermission(session, "user_approvals.approve")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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

  const defaultRoleName = await getStringSetting(
    "default_user_role",
    "STUDENT",
  );

  const defaultRole = await prisma.role.findUnique({
    where: { name: defaultRoleName },
  });

  if (!defaultRole) {
    return NextResponse.json(
      { message: `Default role ${defaultRoleName} tidak ditemukan.` },
      { status: 500 },
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: approval.userId },
      data: {
        status: "ACTIVE",
      },
    });

    await tx.userApproval.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    await tx.userRole.upsert({
      where: {
        userId_roleId: {
          userId: approval.userId,
          roleId: defaultRole.id,
        },
      },
      update: {},
      create: {
        userId: approval.userId,
        roleId: defaultRole.id,
      },
    });

    return updatedUser;
  });

  await createActivityLog({
    userId: session.user.id,
    action: "APPROVE_USER",
    module: "user_approvals",
    description: `${session.user.name} menyetujui akun ${approval.user.name}.`,
    ipAddress,
    userAgent,
    oldData: {
      userId: approval.userId,
      status: approval.user.status,
      approvalStatus: approval.status,
    },
    newData: {
      userId: approval.userId,
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      defaultRole: defaultRoleName,
    },
    metadata: {
      approvedUserId: approval.userId,
      approvedUsername: approval.user.username,
    },
  });

  await createNotification({
    userId: approval.userId,
    title: "Akun Disetujui",
    message: "Akun Anda sudah disetujui. Silakan login.",
    type: "success",
    link: "/login",
  });

  return NextResponse.json({
    message: "User berhasil disetujui.",
    data: result,
  });
}
