import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const sb = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // ใช้ getUser() ไม่ใช่ getSession() — getUser ตรวจ JWT กับ Supabase Auth server (ปลอมไม่ได้)
  // และ trigger refresh token + เขียน cookie ใหม่ผ่าน setAll ป้องกันอาการ "อยู่ดีๆ หลุด login"
  const {
    data: { user },
  } = await sb.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path.startsWith("/login");
  const isPublicPage = path.startsWith("/register");

  if (!user && !isLoginPage && !isPublicPage) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|mp4|mp3|pdf)$).*)",
  ],
};
