import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { searchSite } from "@/lib/search";

/**
 * Index tim kiem la tinh (sinh tu page spec) nen khong can DB, NHUNG route van
 * phai dynamic: voi `force-static`, Next prerender route bang URL luc build nen
 * request.url khong con query string — searchParams.get("q") luon rong.
 * Thay vao do dung Cache-Control de CDN/browser van cache duoc ket qua.
 */
export const dynamic = "force-dynamic";

const CACHE_HEADER = "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400";

const LIMIT = 60;
const WINDOW_MS = 60_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ hits: [], query }, { headers: { "Cache-Control": CACHE_HEADER } });
  }
  if (query.length > 120) {
    return NextResponse.json({ error: "Từ khoá quá dài.", hits: [] }, { status: 400 });
  }

  const gate = rateLimit(`search:${clientIp(request.headers)}`, LIMIT, WINDOW_MS);
  if (!gate.allowed) {
    return NextResponse.json(
      { error: "Bạn tìm kiếm quá nhanh. Vui lòng thử lại sau.", hits: [] },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } },
    );
  }

  try {
    return NextResponse.json(
      { hits: searchSite(query), query },
      { headers: { "Cache-Control": CACHE_HEADER } },
    );
  } catch (error) {
    console.error("[api/search]", error);
    return NextResponse.json(
      { error: "Không thực hiện được tìm kiếm. Vui lòng thử lại.", hits: [] },
      { status: 500 },
    );
  }
}
