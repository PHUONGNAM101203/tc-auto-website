import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { guard } from "@/lib/crawl-guard";

/**
 * Lam moi session Supabase tren moi request va chan /admin khi chua dang nhap.
 *
 * Server Component khong duoc phep ghi cookie, nen viec refresh token PHAI
 * xay ra o day — neu khong, session het han se lam admin bi dang xuat ngau nhien.
 *
 * Tep nay truoc day ten `middleware.ts`. Next 16 doi ten quy uoc thanh `proxy`
 * (ten cu bi loai bo dan): cung mot co che, chi doi ten TEP va ten HAM, con
 * `config.matcher` giu nguyen. Doi ten vi "middleware" hay bi hieu nham sang
 * middleware cua Express — xem node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/proxy.md.
 *
 * Tu 02/10/2026 tep nay con chan cao du lieu (src/lib/crawl-guard.ts) cho
 * MOI tuyen chu khong rieng /admin.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chan cao du lieu chay TRUOC moi thu khac: no chi doc header nen rat re,
  // va request bi tu choi thi khong nen ton them mot vong goi Supabase.
  const verdict = guard(
    pathname,
    request.headers,
    request.method === "POST" && pathname === "/admin/login",
  );
  if (verdict.kind === "deny") {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (verdict.kind === "slow") {
    return new NextResponse("Quá nhiều yêu cầu. Vui lòng chậm lại.", {
      status: 429,
      headers: {
        "Retry-After": String(verdict.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    });
  }

  // Ngoai /admin thi khong can phien dang nhap. Dung dung toi Supabase o day:
  // moi trang cong khai deu di qua proxy, ma `getUser()` la mot vong goi mang
  // — bat moi trang cho no la tu bo het loi the cua trang tinh.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Chua cau hinh Supabase: de request di qua, trang /admin se hien huong dan setup.
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = pathname === "/admin/login";

  if (!user && !isLogin) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && isLogin) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  /**
   * MOI tuyen tru tep tinh.
   *
   * Phai loai tep tinh ra, khong phai de nhanh ma vi DUNG SAI: mot trang keo
   * theo hang chuc anh lat nen, phong va script. Tinh ca chung vao nhip thi
   * mot nguoi mo mot trang da an het han muc, con may cao chi lay HTML thi
   * gan nhu khong ton gi — dao nguoc han y dinh.
   *
   * `robots.txt` va `sitemap.xml` cung mien tru: chan may tim kiem doc hai
   * tep do la tu ban vao chan minh.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon|robots\\.txt|sitemap\\.xml|slices|brand|cards|hero|lift|mobile|ppf|products|related|sliders|solutions|fonts|projects).*)",
  ],
};
