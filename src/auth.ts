import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { CredentialsSignin } from "next-auth";

import { prisma } from "@/lib/prisma";
import { getBooleanSetting } from "@/lib/settings";

class InvalidLoginError extends CredentialsSignin {
  code = "credentials";
}

class MaintenanceModeError extends CredentialsSignin {
  code = "maintenance";
}

export const authConfig = {
  trustHost: true,

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
          throw new InvalidLoginError();
        }

        const user = await prisma.user.findUnique({
          where: {
            username,
          },
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
          throw new InvalidLoginError();
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new InvalidLoginError();
        }

        if (user.status === "PENDING") {
          throw new InvalidLoginError();
        }

        if (user.status === "DECLINED") {
          throw new InvalidLoginError();
        }

        if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
          throw new InvalidLoginError();
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
          where: {
            id: user.id,
          },
          data: {
            lastLoginAt: new Date(),
          },
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
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as string[]) || [];
        session.user.permissions = (token.permissions as string[]) || [];
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
