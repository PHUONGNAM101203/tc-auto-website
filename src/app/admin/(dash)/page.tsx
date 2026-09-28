import Link from "next/link";
import { DailyLeadsChart } from "@/components/admin/charts/DailyLeadsChart";
import { HeroFigure, StatTile } from "@/components/admin/charts/StatTile";
import { StatusBreakdown } from "@/components/admin/charts/StatusBreakdown";
import { TopPagesChart } from "@/components/admin/charts/TopPagesChart";
import { Card, EmptyState } from "@/components/admin/ui";
import { getDashboardStats } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let stats;
  try {
    stats = await getDashboardStats();
  } catch (error) {
    return (
      <EmptyState
        title="Không tải được số liệu"
        description={
          error instanceof Error
            ? error.message
            : "Kiểm tra lại kết nối Supabase và đảm bảo đã chạy migration."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold">Tổng quan</h1>
        <p className="mt-1 text-xs text-white/45">
          Số liệu khách hàng tiềm năng và tình trạng nội dung website.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HeroFigure
          label="Tổng khách hàng tiềm năng"
          value={stats.total}
          hint="Toàn bộ thời gian"
        />
        <StatTile label="Hôm nay" value={stats.today} />
        <StatTile label="7 ngày qua" value={stats.last7Days} />
        <StatTile label="30 ngày qua" value={stats.last30Days} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="Khách hàng theo ngày"
          description="14 ngày gần nhất, tính theo thời điểm gửi form."
        >
          <DailyLeadsChart data={stats.daily} />
        </Card>

        <div className="space-y-4">
          <Card title="Theo trạng thái" description="Trong 30 ngày gần nhất.">
            <StatusBreakdown counts={stats.byStatus} />
          </Card>

          <Card title="Trang mang lại khách" description="Nguồn gửi form, 30 ngày.">
            <TopPagesChart data={stats.topPages} />
          </Card>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card title="Nội dung">
          <p className="text-sm text-white/80">
            <strong className="text-2xl font-semibold tracking-tight">{stats.overrides}</strong>{" "}
            <span className="text-xs text-white/50">phần tử đã sửa khác bản Figma</span>
          </p>
          <Link
            href="/admin/content"
            className="mt-3 inline-block text-xs text-sky transition hover:text-white"
          >
            Quản lý nội dung →
          </Link>
        </Card>

        <Card title="Thư viện media">
          <p className="text-sm text-white/80">
            <strong className="text-2xl font-semibold tracking-tight">{stats.mediaCount}</strong>{" "}
            <span className="text-xs text-white/50">tệp đã tải lên</span>
          </p>
          <Link
            href="/admin/media"
            className="mt-3 inline-block text-xs text-sky transition hover:text-white"
          >
            Mở thư viện →
          </Link>
        </Card>
      </div>
    </div>
  );
}
