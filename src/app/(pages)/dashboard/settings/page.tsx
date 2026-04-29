import { requirePermission } from "@/lib/require-permission";
import GeneralSettingsForm from "@/features/settings/components/general-settings-form";

export default async function SettingsPage() {
  await requirePermission("settings.view");

  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">
          General Settings
        </h3>
        <p className="text-sm text-slate-500">
          Atur konfigurasi umum website LMS.
        </p>
      </div>

      <GeneralSettingsForm />
    </div>
  );
}
