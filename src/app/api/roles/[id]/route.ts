import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "roles.update"))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const payload = schema.parse(body);

  const role = await prisma.$transaction(async (tx) => {
    const updated = await tx.role.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description,
        isDefault: payload.isDefault || false,
      },
    });

    await tx.rolePermission.deleteMany({ where: { roleId: id } });

    if (payload.permissionIds?.length) {
      await tx.rolePermission.createMany({
        data: payload.permissionIds.map((pid) => ({
          roleId: id,
          permissionId: pid,
        })),
      });
    }

    return updated;
  });

  return NextResponse.json({
    message: "Role berhasil diupdate.",
    data: role,
  });
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "roles.delete"))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const role = await prisma.role.findUnique({ where: { id } });

  if (!role) {
    return NextResponse.json(
      { message: "Role tidak ditemukan." },
      { status: 404 },
    );
  }

  if (role.name === "SUPERADMIN") {
    return NextResponse.json(
      { message: "Role ini tidak bisa dihapus. Jangan sok jago." },
      { status: 400 },
    );
  }

  await prisma.role.delete({ where: { id } });

  return NextResponse.json({ message: "Role berhasil dihapus." });
}
