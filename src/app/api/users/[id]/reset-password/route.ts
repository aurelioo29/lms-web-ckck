import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { createNotification } from "@/lib/notification";
import { getRequestMeta } from "@/lib/request";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const payload = resetPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "RESET_USER_PASSWORD",
      module: "users",
      description: `${session.user.name} reset password user ${user.name}.`,
      ipAddress,
      userAgent,
      oldData: {
        passwordChanged: false,
      },
      newData: {
        passwordChanged: true,
      },
      metadata: {
        targetUserId: user.id,
        targetUsername: user.username,
      },
    });

    await createNotification({
      userId: user.id,
      title: "Password Direset",
      message: "Password akun Anda telah direset oleh admin.",
      type: "warning",
      link: "/login",
    });

    return NextResponse.json({
      message: "Password user berhasil direset.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Validasi gagal.",
          errors: error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    console.error("Reset user password error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
