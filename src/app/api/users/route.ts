import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { createNotification } from "@/lib/notification";
import { getRequestMeta } from "@/lib/request";

const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh huruf, angka, dan underscore",
    ),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  roleId: z.string().uuid("Role tidak valid").optional(),
  status: z
    .enum(["ACTIVE", "PENDING", "INACTIVE", "SUSPENDED"])
    .default("ACTIVE"),
});

const allowedSortFields = ["name", "username", "email", "status", "createdAt"];

const validUserStatuses = [
  "ACTIVE",
  "PENDING",
  "INACTIVE",
  "SUSPENDED",
] as const;

type UserStatus = (typeof validUserStatuses)[number];

function isValidUserStatus(value: string): value is UserStatus {
  return validUserStatuses.includes(value as UserStatus);
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const search = searchParams.get("search") || "";
  const statusParam = searchParams.get("status") || "";
  const roleId = searchParams.get("roleId") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const status = isValidUserStatus(statusParam) ? statusParam : undefined;

  const skip = (page - 1) * limit;
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const where: Prisma.UserWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
      roleId
        ? {
            roles: {
              some: {
                roleId,
              },
            },
          }
        : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const payload = createUserSchema.parse(body);

    const username = payload.username.toLowerCase().trim();
    const email = payload.email.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username atau email sudah digunakan." },
        { status: 409 },
      );
    }

    let selectedRole = null;

    if (payload.roleId) {
      selectedRole = await prisma.role.findUnique({
        where: { id: payload.roleId },
      });
    } else {
      selectedRole = await prisma.role.findFirst({
        where: { isDefault: true },
      });
    }

    if (!selectedRole) {
      return NextResponse.json(
        { message: "Role tidak ditemukan." },
        { status: 404 },
      );
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const { ipAddress, userAgent } = await getRequestMeta();

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: payload.name,
          username,
          email,
          password: hashedPassword,
          phone: payload.phone || null,
          bio: payload.bio || null,
          status: payload.status,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          bio: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: selectedRole.id,
        },
      });

      return user;
    });

    await createActivityLog({
      userId: session.user.id,
      action: "CREATE_USER",
      module: "users",
      description: `${session.user.name} membuat user ${createdUser.name}.`,
      ipAddress,
      userAgent,
      oldData: Prisma.JsonNull,
      newData: {
        ...createdUser,
        role: selectedRole.name,
      },
      metadata: {
        createdBy: session.user.id,
      },
    });

    await createNotification({
      userId: createdUser.id,
      title: "Akun Dibuat",
      message: "Akun Anda sudah dibuat oleh admin. Silakan login.",
      type: "success",
      link: "/login",
    });

    return NextResponse.json(
      {
        message: "User berhasil dibuat.",
        data: createdUser,
      },
      { status: 201 },
    );
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

    console.error("Create user error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
