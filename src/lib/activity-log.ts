import { Prisma } from "@/generated/prisma";

import { prisma } from "@/lib/prisma";

type JsonValueInput = Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;

type CreateActivityLogParams = {
  userId?: string | null;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  oldData?: JsonValueInput;
  newData?: JsonValueInput;
  metadata?: JsonValueInput;
};

export async function createActivityLog({
  userId,
  action,
  module,
  description,
  ipAddress,
  userAgent,
  oldData,
  newData,
  metadata,
}: CreateActivityLogParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        module,
        description,
        ipAddress,
        userAgent,
        oldData,
        newData,
        metadata,
      },
    });
  } catch (error) {
    console.error("Failed to create activity log:", error);
    return null;
  }
}
