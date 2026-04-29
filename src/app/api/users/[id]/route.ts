import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const updateUserSchema = z.object({
  name: z.string().min(2),
  username: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "PENDING", "INACTIVE", "SUSPENDED", "DECLINED"]),
  roleId: z.string().uuid("Role tidak valid").optional(),
  password: z.string().min(6).optional().or(z.literal("")),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
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

  return NextResponse.json({ data: user });
}

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
    const payload = updateUserSchema.parse(body);

    const oldUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!oldUser) {
      return NextResponse.json(
        { message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    const username = payload.username.toLowerCase().trim();
    const email = payload.email.toLowerCase().trim();

    const duplicateUser = await prisma.user.findFirst({
      where: {
        id: {
          not: id,
        },
        OR: [{ username }, { email }],
      },
    });

    if (duplicateUser) {
      return NextResponse.json(
        { message: "Username atau email sudah digunakan user lain." },
        { status: 409 },
      );
    }

    let selectedRole = null;

    if (payload.roleId) {
      selectedRole = await prisma.role.findUnique({
        where: { id: payload.roleId },
      });

      if (!selectedRole) {
        return NextResponse.json(
          { message: "Role tidak ditemukan." },
          { status: 404 },
        );
      }
    }

    const passwordData = payload.password
      ? {
          password: await bcrypt.hash(payload.password, 10),
        }
      : {};

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          name: payload.name,
          username,
          email,
          phone: payload.phone || null,
          bio: payload.bio || null,
          status: payload.status,
          ...passwordData,
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (selectedRole) {
        await tx.userRole.deleteMany({
          where: { userId: id },
        });

        await tx.userRole.create({
          data: {
            userId: id,
            roleId: selectedRole.id,
          },
        });
      }

      return tx.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "UPDATE_USER",
      module: "users",
      description: `${session.user.name} memperbarui user ${payload.name}.`,
      ipAddress,
      userAgent,
      oldData: {
        id: oldUser.id,
        name: oldUser.name,
        username: oldUser.username,
        email: oldUser.email,
        phone: oldUser.phone,
        bio: oldUser.bio,
        status: oldUser.status,
        roles: oldUser.roles.map((item) => item.role.name),
      },
      newData: updatedUser
        ? {
            id: updatedUser.id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            phone: updatedUser.phone,
            bio: updatedUser.bio,
            status: updatedUser.status,
            roles: updatedUser.roles.map((item) => item.role.name),
            passwordChanged: Boolean(payload.password),
          }
        : Prisma.JsonNull,
      metadata: {
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "User berhasil diperbarui.",
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

    console.error("Update user error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users.delete")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (session.user.id === id) {
    return NextResponse.json(
      {
        message:
          "Tidak bisa menghapus akun sendiri. Itu namanya bunuh diri admin.",
      },
      { status: 400 },
    );
  }

  const oldUser = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!oldUser) {
    return NextResponse.json(
      { message: "User tidak ditemukan." },
      { status: 404 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({
      where: { userId: id },
    });

    await tx.user.delete({
      where: { id },
    });
  });

  const { ipAddress, userAgent } = await getRequestMeta();

  await createActivityLog({
    userId: session.user.id,
    action: "DELETE_USER",
    module: "users",
    description: `${session.user.name} menghapus user ${oldUser.name}.`,
    ipAddress,
    userAgent,
    oldData: {
      id: oldUser.id,
      name: oldUser.name,
      username: oldUser.username,
      email: oldUser.email,
      status: oldUser.status,
      roles: oldUser.roles.map((item) => item.role.name),
    },
    newData: Prisma.JsonNull,
    metadata: {
      deletedBy: session.user.id,
    },
  });

  return NextResponse.json({
    message: "User berhasil dihapus.",
  });
}
