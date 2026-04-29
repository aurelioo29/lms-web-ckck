"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

function formatTitle(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DashboardBreadcrumb() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex h-10 items-center gap-1 text-xs text-slate-500">
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;

        return (
          <div key={href} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight size={13} /> : null}

            {isLast ? (
              <span className="font-medium text-slate-700">
                {formatTitle(segment)}
              </span>
            ) : (
              <Link href={href} className="hover:text-blue-600">
                {formatTitle(segment)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
