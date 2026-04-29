import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { CredentialsSignin } from "next-auth";

import { prisma } from "@/lib/prisma";
import { getBooleanSetting } from "@/lib/settings";

class MaintenanceModeError extends CredentialsSignin {
  code = "maintenance";
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 3,
  },
  jwt: {
    maxAge: 60 * 60 * 3,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const username = String(credentials?.username || "")
          .toLowerCase()
          .trim();

        const password = String(credentials?.password || "");

        if (!username || !password) {
          throw new Error("Username dan password wajib diisi.");
        }

        const user = await prisma.user.findUnique({
          where: { username },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!user) {
          throw new Error("Username atau password salah.");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error("Username atau password salah.");
        }

        if (user.status === "PENDING") {
          throw new Error("Akun Anda masih menunggu persetujuan admin.");
        }

        if (user.status === "DECLINED") {
          throw new Error("Pendaftaran akun Anda ditolak.");
        }

        if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
          throw new Error("Akun Anda sedang dinonaktifkan.");
        }

        const roles = user.roles.map((item) => item.role.name);

        const maintenanceMode = await getBooleanSetting(
          "maintenance_mode",
          false,
        );

        if (maintenanceMode && !roles.includes("SUPERADMIN")) {
          throw new MaintenanceModeError();
        }

        const permissions = user.roles.flatMap((item) =>
          item.role.permissions.map((rp) => rp.permission.name),
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            module: "auth",
            description: `${user.name} login ke sistem.`,
            metadata: {
              username: user.username,
              email: user.email,
            },
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          roles,
          permissions: Array.from(new Set(permissions)),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.roles = token.roles as string[];
      session.user.permissions = token.permissions as string[];

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
