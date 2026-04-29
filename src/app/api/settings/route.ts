import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
      type: z.string().optional(),
      description: z.string().optional().nullable(),
    }),
  ),
});

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "settings.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.setting.findMany({
    orderBy: {
      key: "asc",
    },
  });

  return NextResponse.json({
    data: settings,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "settings.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const payload = updateSettingsSchema.parse(body);

    const keys = payload.settings.map((item) => item.key);

    const oldSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: keys,
        },
      },
      orderBy: {
        key: "asc",
      },
    });

    const updatedSettings = await prisma.$transaction(
      payload.settings.map((item) =>
        prisma.setting.upsert({
          where: {
            key: item.key,
          },
          update: {
            value: item.value,
            type: item.type || "string",
            description: item.description ?? null,
          },
          create: {
            key: item.key,
            value: item.value,
            type: item.type || "string",
            description: item.description ?? null,
          },
        }),
      ),
    );

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "UPDATE_SETTINGS",
      module: "settings",
      description: `${session.user.name} memperbarui general settings.`,
      ipAddress,
      userAgent,
      oldData: oldSettings.map((setting) => ({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        description: setting.description,
      })),
      newData: updatedSettings.map((setting) => ({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        description: setting.description,
      })),
      metadata: {
        source: "general_settings_page",
      },
    });

    return NextResponse.json({
      message: "Settings berhasil diperbarui.",
      data: updatedSettings,
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

    console.error("Update settings error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
