import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      bio: true,
      avatar: true,
      status: true,
      createdAt: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { message: "User tidak ditemukan." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: user,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const payload = updateProfileSchema.parse(body);

    const oldUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        bio: true,
        status: true,
      },
    });

    if (!oldUser) {
      return NextResponse.json(
        { message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    const email = payload.email.toLowerCase().trim();

    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: session.user.id,
        },
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: "Email sudah digunakan user lain." },
        { status: 409 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: payload.name,
        email,
        phone: payload.phone || null,
        bio: payload.bio || null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        bio: true,
        status: true,
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "UPDATE_PROFILE",
      module: "profile",
      description: `${updatedUser.name} memperbarui profile.`,
      ipAddress,
      userAgent,
      oldData: oldUser,
      newData: updatedUser,
      metadata: {
        source: "profile_page",
      },
    });

    return NextResponse.json({
      message: "Profile berhasil diperbarui.",
      data: updatedUser,
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

    console.error("Update profile error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
