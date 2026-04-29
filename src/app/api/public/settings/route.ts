import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "site_name",
          "site_description",
          "allow_registration",
          "approval_required",
          "maintenance_mode",
        ],
      },
    },
    select: {
      key: true,
      value: true,
      type: true,
    },
  });

  const result = settings.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return NextResponse.json({
    data: {
      siteName: result.site_name || "CKCK LMS",
      siteDescription: result.site_description || "Learning Management System",
      allowRegistration: result.allow_registration !== "false",
      approvalRequired: result.approval_required !== "false",
      maintenanceMode: result.maintenance_mode === "true",
    },
  });
}
