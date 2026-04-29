import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const permissions = [
  {
    name: "dashboard.view",
    module: "dashboard",
    description: "View dashboard",
  },

  { name: "users.view", module: "users", description: "View users" },
  { name: "users.create", module: "users", description: "Create users" },
  { name: "users.update", module: "users", description: "Update users" },
  { name: "users.delete", module: "users", description: "Delete users" },

  {
    name: "user_approvals.view",
    module: "user_approvals",
    description: "View user approvals",
  },
  {
    name: "user_approvals.approve",
    module: "user_approvals",
    description: "Approve users",
  },
  {
    name: "user_approvals.decline",
    module: "user_approvals",
    description: "Decline users",
  },

  { name: "roles.view", module: "roles", description: "View roles" },
  { name: "roles.create", module: "roles", description: "Create roles" },
  { name: "roles.update", module: "roles", description: "Update roles" },
  { name: "roles.delete", module: "roles", description: "Delete roles" },

  {
    name: "permissions.view",
    module: "permissions",
    description: "View permissions",
  },

  { name: "courses.view", module: "courses", description: "View courses" },
  { name: "courses.create", module: "courses", description: "Create courses" },
  { name: "courses.update", module: "courses", description: "Update courses" },
  { name: "courses.delete", module: "courses", description: "Delete courses" },

  { name: "lessons.view", module: "lessons", description: "View lessons" },
  { name: "lessons.create", module: "lessons", description: "Create lessons" },
  { name: "lessons.update", module: "lessons", description: "Update lessons" },
  { name: "lessons.delete", module: "lessons", description: "Delete lessons" },

  {
    name: "enrollments.view",
    module: "enrollments",
    description: "View enrollments",
  },
  {
    name: "enrollments.create",
    module: "enrollments",
    description: "Create enrollments",
  },

  {
    name: "attendance.view",
    module: "attendance",
    description: "View attendance",
  },
  {
    name: "attendance.create",
    module: "attendance",
    description: "Create attendance",
  },
  {
    name: "attendance.update",
    module: "attendance",
    description: "Update attendance",
  },

  { name: "points.view", module: "points", description: "View points" },
  {
    name: "leaderboard.view",
    module: "leaderboard",
    description: "View leaderboard",
  },

  { name: "settings.view", module: "settings", description: "View settings" },
  {
    name: "settings.update",
    module: "settings",
    description: "Update settings",
  },

  {
    name: "activity_logs.view",
    module: "activity_logs",
    description: "View activity logs",
  },

  {
    name: "notifications.view",
    module: "notifications",
    description: "View notifications",
  },
];

async function main() {
  console.log("Start seeding...");

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permission.name,
      },
      update: permission,
      create: permission,
    });
  }

  const superadminRole = await prisma.role.upsert({
    where: {
      name: "SUPERADMIN",
    },
    update: {
      description: "Highest system role with full access",
      isDefault: false,
    },
    create: {
      name: "SUPERADMIN",
      description: "Highest system role with full access",
      isDefault: false,
    },
  });

  const studentRole = await prisma.role.upsert({
    where: {
      name: "STUDENT",
    },
    update: {
      description: "Default student role",
      isDefault: true,
    },
    create: {
      name: "STUDENT",
      description: "Default student role",
      isDefault: true,
    },
  });

  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superadminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superadminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const studentPermissionNames = [
    "dashboard.view",
    "courses.view",
    "lessons.view",
    "enrollments.create",
    "leaderboard.view",
    "notifications.view",
  ];

  const studentPermissions = allPermissions.filter((permission) =>
    studentPermissionNames.includes(permission.name),
  );

  for (const permission of studentPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: studentRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: studentRole.id,
        permissionId: permission.id,
      },
    });
  }

  const hashedPassword = await bcrypt.hash("admin12345", 10);

  const admin = await prisma.user.upsert({
    where: {
      username: "superadmin",
    },
    update: {
      name: "Super Admin",
      email: "admin@lms.com",
      password: hashedPassword,
      status: "ACTIVE",
    },
    create: {
      name: "Super Admin",
      email: "admin@lms.com",
      username: "superadmin",
      password: hashedPassword,
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: superadminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: superadminRole.id,
    },
  });

  const settings = [
    {
      key: "site_name",
      value: "Next LMS",
      type: "string",
      description: "Website name",
    },
    {
      key: "allow_registration",
      value: "true",
      type: "boolean",
      description: "Allow public registration",
    },
    {
      key: "default_user_role",
      value: "STUDENT",
      type: "string",
      description: "Default role after user approval",
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: {
        key: setting.key,
      },
      update: setting,
      create: setting,
    });
  }

  console.log("Seeding completed.");
  console.log("Login admin:");
  console.log("Username: superadmin");
  console.log("Password: admin12345");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
