import { Suspense } from "react";

import LoginForm from "../../../features/auth/components/login-form";

function LoginFallback() {
  return (
    <main className="auth-page">
      <div className="auth-card flex min-h-[260px] items-center justify-center">
        <span className="text-sm text-slate-500">Loading login...</span>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
