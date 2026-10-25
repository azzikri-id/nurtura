import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AREA_TERLINDUNG = ["/kader", "/bidan", "/orang-tua", "/admin", "/akun"];

/**
 * Memperbarui sesi Supabase di setiap request dan mengalihkan pengunjung yang belum masuk
 * dari area terlindung. Ini hanya pemeriksaan awal; hak akses sebenarnya dijaga oleh
 * pemeriksaan peran di server dan Row Level Security di database.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (daftar) => {
          for (const { name, value } of daftar) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of daftar) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const masuk = !!data?.claims;
  const path = request.nextUrl.pathname;

  if (!masuk && AREA_TERLINDUNG.some((a) => path === a || path.startsWith(`${a}/`))) {
    const tujuan = request.nextUrl.clone();
    tujuan.pathname = "/masuk";
    tujuan.search = `?lanjut=${encodeURIComponent(path)}`;
    return NextResponse.redirect(tujuan);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|brand/|api/v1/status-gizi).*)"],
};
