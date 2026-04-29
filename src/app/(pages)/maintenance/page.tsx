import Link from "next/link";
import { Button, Card } from "antd";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Card className="w-full max-w-[480px] text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <Wrench size={28} />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Sistem Sedang Maintenance
        </h1>

        <p className="mb-6 text-sm text-slate-500">
          Website sedang diperbaiki sementara. Coba lagi nanti. Ya, sistem juga
          butuh healing.
        </p>

        <Link href="/login">
          <Button type="primary">Kembali ke Login</Button>
        </Link>
      </Card>
    </main>
  );
}
