import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "roles.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const permissions = await prisma.permission.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({
    data: permissions,
  });
}
