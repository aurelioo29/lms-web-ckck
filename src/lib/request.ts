import { headers } from "next/headers";

export async function getRequestMeta() {
  const headersList = await headers();

  const ipAddress =
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    "unknown";

  const userAgent = headersList.get("user-agent") || "unknown";

  return {
    ipAddress,
    userAgent,
  };
}
