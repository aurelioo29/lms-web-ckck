import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "user_approvals.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "PENDING";
  const createdAtStart = searchParams.get("createdAtStart") || "";
  const createdAtEnd = searchParams.get("createdAtEnd") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const skip = (page - 1) * limit;

  const startDate = createdAtStart
    ? new Date(`${createdAtStart}T00:00:00`)
    : null;

  const endDate = createdAtEnd ? new Date(`${createdAtEnd}T23:59:59`) : null;

  const allowedSortFields = ["createdAt", "reviewedAt", "status"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const where = {
    AND: [
      search
        ? {
            OR: [
              {
                user: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                user: {
                  username: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                user: {
                  email: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {},
      status
        ? {
            status,
          }
        : {},
      startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.userApproval.findMany({
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
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),
    prisma.userApproval.count({ where }),
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
