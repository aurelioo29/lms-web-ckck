import { prisma } from "@/lib/prisma";

type CreateNotificationParams = {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
};

export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  link,
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
    },
  });
}

type NotifyRoleParams = {
  roleName: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
};

export async function notifyUsersByRole({
  roleName,
  title,
  message,
  type = "info",
  link,
}: NotifyRoleParams) {
  const users = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: roleName,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (users.length === 0) return [];

  return prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title,
      message,
      type,
      link,
    })),
  });
}

export async function notifySuperadmins({
  title,
  message,
  type = "info",
  link,
}: Omit<NotifyRoleParams, "roleName">) {
  return notifyUsersByRole({
    roleName: "SUPERADMIN",
    title,
    message,
    type,
    link,
  });
}
