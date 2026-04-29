import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import { prisma } from "@/lib/prisma";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getSettingValue(key: string, fallback: string) {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    });

    return setting?.value || fallback;
  } catch {
    return fallback;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSettingValue("site_name", "CKCK LMS");
  const siteDescription = await getSettingValue(
    "site_description",
    "Learning Management System",
  );

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full">
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
