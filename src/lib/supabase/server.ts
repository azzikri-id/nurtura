import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Klien Supabase atas nama pengguna yang sedang masuk (sesi dari cookie).
 * Semua query lewat klien ini tunduk pada Row Level Security.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(url(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // Sesi hanya dipakai di server, jadi cookie bisa HttpOnly (aman dari pencurian lewat XSS).
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (daftar) => {
        try {
          for (const { name, value, options } of daftar) cookieStore.set(name, value, options);
        } catch {
          // Dipanggil dari Server Component (cookie read-only); sesi diperbarui oleh proxy.
        }
      },
    },
  });
}

/**
 * Klien admin (service role) yang MELEWATI RLS. Hanya untuk tugas server yang memang
 * butuh hak admin, mis. membuat akun kader. Jangan pernah dipakai untuk membaca data
 * atas nama pengguna.
 */
export function createAdminClient() {
  return createSupabaseClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
