import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isAdminConfigured } from "@/lib/supabase/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { fieldErrors, leadInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Toi da 5 lan gui / 10 phut / IP — du cho nguoi that, chan spam. */
const LIMIT = 5;
const WINDOW_MS = 10 * 60_000;

export async function POST(request: Request) {
  const gate = rateLimit(`lead:${clientIp(request.headers)}`, LIMIT, WINDOW_MS);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: `Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(
          gate.retryAfterSeconds / 60,
        )} phút.`,
      },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Vui lòng kiểm tra lại thông tin.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  // Honeypot co gia tri => gan chac la bot. Tra ve 200 de bot khong biet bi chan.
  if (parsed.data.honeypot) {
    console.warn("[api/leads] honeypot triggered", clientIp(request.headers));
    return NextResponse.json({ ok: true });
  }

  if (!isAdminConfigured()) {
    console.error("[api/leads] Supabase chưa được cấu hình — không lưu được lead.");
    return NextResponse.json(
      {
        error:
          "Hệ thống tiếp nhận đang tạm bảo trì. Vui lòng gọi trực tiếp hotline để được hỗ trợ ngay.",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("leads").insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      message: parsed.data.message || null,
      source_page: parsed.data.sourcePage,
      status: "new",
      user_agent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[api/leads] insert failed:", error);
    return NextResponse.json(
      { error: "Không gửi được thông tin. Vui lòng thử lại sau ít phút." },
      { status: 500 },
    );
  }
}
