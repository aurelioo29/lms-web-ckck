import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const payload = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      payload.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { message: "Password lama salah." },
        { status: 400 },
      );
    }

    const isSamePassword = await bcrypt.compare(
      payload.newPassword,
      user.password,
    );

    if (isSamePassword) {
      return NextResponse.json(
        { message: "Password baru tidak boleh sama dengan password lama." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "CHANGE_PASSWORD",
      module: "profile",
      description: `${user.name} mengganti password akun.`,
      ipAddress,
      userAgent,
      oldData: {
        passwordChanged: false,
      },
      newData: {
        passwordChanged: true,
      },
      metadata: {
        username: user.username,
        email: user.email,
      },
    });

    return NextResponse.json({
      message: "Password berhasil diubah.",
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

    console.error("Change password error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
