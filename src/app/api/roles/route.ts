import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "roles.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: roles });
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "roles.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const payload = roleSchema.parse(body);

    const existing = await prisma.role.findFirst({
      where: { name: payload.name },
    });

    if (existing) {
      return NextResponse.json({ message: "Role sudah ada." }, { status: 409 });
    }

    const { ipAddress, userAgent } = await getRequestMeta();

    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          name: payload.name,
          description: payload.description,
          isDefault: payload.isDefault || false,
        },
      });

      if (payload.permissionIds?.length) {
        await tx.rolePermission.createMany({
          data: payload.permissionIds.map((pid) => ({
            roleId: created.id,
            permissionId: pid,
          })),
        });
      }

      return created;
    });

    await createActivityLog({
      userId: session.user.id,
      action: "CREATE_ROLE",
      module: "roles",
      description: `${session.user.name} membuat role ${role.name}.`,
      ipAddress,
      userAgent,
      newData: role,
    });

    return NextResponse.json(
      { message: "Role berhasil dibuat.", data: role },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validasi gagal.", errors: e.flatten().fieldErrors },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
