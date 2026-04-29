import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { notifySuperadmins, createNotification } from "@/lib/notification";
import { getBooleanSetting, getStringSetting } from "@/lib/settings";
import { getRequestMeta } from "@/lib/request";

const registerSchema = z.object({
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
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = registerSchema.parse(body);

    const allowRegistration = await getBooleanSetting(
      "allow_registration",
      true,
    );

    if (!allowRegistration) {
      return NextResponse.json(
        {
          message: "Pendaftaran sedang ditutup.",
        },
        { status: 403 },
      );
    }

    const approvalRequired = await getBooleanSetting("approval_required", true);

    const defaultRoleName = await getStringSetting(
      "default_user_role",
      "STUDENT",
    );

    const username = payload.username.toLowerCase().trim();
    const email = payload.email.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "Username atau email sudah digunakan.",
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const { ipAddress, userAgent } = await getRequestMeta();

    const defaultRole = await prisma.role.findUnique({
      where: {
        name: defaultRoleName,
      },
    });

    if (!approvalRequired && !defaultRole) {
      return NextResponse.json(
        {
          message: `Default role ${defaultRoleName} tidak ditemukan.`,
        },
        { status: 500 },
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: payload.name,
          username,
          email,
          password: hashedPassword,
          status: approvalRequired ? "PENDING" : "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          status: true,
        },
      });

      if (approvalRequired) {
        await tx.userApproval.create({
          data: {
            userId: createdUser.id,
            status: "PENDING",
          },
        });
      }

      if (!approvalRequired && defaultRole) {
        await tx.userRole.create({
          data: {
            userId: createdUser.id,
            roleId: defaultRole.id,
          },
        });
      }

      return createdUser;
    });

    await createActivityLog({
      userId: user.id,
      action: "REGISTER",
      module: "auth",
      description: approvalRequired
        ? `${user.name} melakukan registrasi akun dan menunggu approval.`
        : `${user.name} melakukan registrasi akun dan langsung aktif.`,
      ipAddress,
      userAgent,
      oldData: null,
      newData: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        status: user.status,
        approvalRequired,
        defaultRole: approvalRequired ? null : defaultRoleName,
      },
      metadata: {
        source: "public_register",
      },
    });

    if (approvalRequired) {
      await notifySuperadmins({
        title: "Pendaftaran User Baru",
        message: `${user.name} menunggu persetujuan akun.`,
        type: "approval",
        link: "/dashboard/user-approvals",
      });
    } else {
      await createNotification({
        userId: user.id,
        title: "Registrasi Berhasil",
        message: "Akun Anda sudah aktif. Silakan login.",
        type: "success",
        link: "/login",
      });
    }

    return NextResponse.json(
      {
        message: approvalRequired
          ? "Registrasi berhasil. Akun Anda menunggu persetujuan admin."
          : "Registrasi berhasil. Akun Anda sudah aktif dan bisa login.",
        data: user,
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

    console.error("Register error:", error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan server.",
      },
      { status: 500 },
    );
  }
}
