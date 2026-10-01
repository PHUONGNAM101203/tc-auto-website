import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
 */
export async function proxy(request: NextRequest) {
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

  const { pathname } = request.nextUrl;
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
  matcher: ["/admin", "/admin/:path*"],
};
