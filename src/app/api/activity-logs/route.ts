import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "activity_logs.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const search = searchParams.get("search") || "";
  const moduleName = searchParams.get("module") || "";
  const action = searchParams.get("action") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const createdAtStart = searchParams.get("createdAtStart") || "";
  const createdAtEnd = searchParams.get("createdAtEnd") || "";

  const skip = (page - 1) * limit;

  const startDate = createdAtStart
    ? new Date(createdAtStart + "T00:00:00")
    : null;

  const endDate = createdAtEnd ? new Date(createdAtEnd + "T23:59:59") : null;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { action: { contains: search, mode: "insensitive" as const } },
              { module: { contains: search, mode: "insensitive" as const } },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {},
      moduleName
        ? {
            module: moduleName,
          }
        : {},
      action
        ? {
            action,
          }
        : {},
      startDate && endDate
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.activityLog.count({ where }),
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
