import { prisma } from "@/lib/prisma";

export async function getSetting(key: string) {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  return setting?.value ?? null;
}

export async function getBooleanSetting(key: string, defaultValue = false) {
  const value = await getSetting(key);

  if (value === null) return defaultValue;

  return value === "true";
}

export async function getStringSetting(key: string, defaultValue = "") {
  const value = await getSetting(key);

  return value ?? defaultValue;
}
