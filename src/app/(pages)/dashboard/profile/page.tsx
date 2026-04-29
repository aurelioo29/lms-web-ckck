import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/features/profile/components/profile-form";
import ChangePasswordForm from "@/features/profile/components/change-password-form";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      bio: true,
      status: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">Profile</h3>
        <p className="text-sm text-slate-500">
          Kelola informasi akun dan password kamu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ProfileForm user={user} />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
