import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card, EmptyState, formatDateTime } from "@/components/admin/ui";
import { getSettings, type SettingsRow } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings: SettingsRow;
  try {
    settings = await getSettings();
  } catch (error) {
    return (
      <EmptyState
        title="Không tải được cài đặt"
        description={
          error instanceof Error
            ? error.message
            : "Đảm bảo đã chạy supabase/migrations/0001_init.sql."
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold">Cài đặt</h1>
        <p className="mt-1 text-xs text-white/45">
          Cập nhật lần cuối {formatDateTime(settings.updatedAt)}.
        </p>
      </header>

      <Card title="Thông tin chung">
        <SettingsForm settings={settings} />
      </Card>
    </div>
  );
}
