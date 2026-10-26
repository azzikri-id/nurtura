import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Peran = "admin" | "bidan" | "kader" | "orang_tua";

export type Pengguna = {
  id: string;
  email: string;
  nama: string;
  peran: Peran;
  puskesmasId: string | null;
};

export const BERANDA: Record<Peran, string> = {
  kader: "/kader",
  bidan: "/bidan",
  orang_tua: "/orang-tua",
  admin: "/admin",
};

export const NAMA_PERAN: Record<Peran, string> = {
  kader: "Kader posyandu",
  bidan: "Bidan",
  orang_tua: "Orang tua",
  admin: "Admin",
};

/**
 * Pengguna yang sedang masuk beserta profilnya, atau null. Identitas diverifikasi ke server Auth.
 * Dibungkus `cache` agar layout dan halaman dalam satu request hanya memeriksa sekali.
 */
export const getPengguna = cache(async (): Promise<Pengguna | null> => {
  // Pemeriksaan sesi memakai Date.now() (masa berlaku token); minta Next.js menunggu permintaan nyata
  // supaya tidak dihitung sebagai nilai tidak stabil saat prefetch/prarender.
  await connection();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profil } = await supabase
    .from("profiles")
    .select("nama, peran, puskesmas_id")
    .eq("id", auth.user.id)
    .single();
  if (!profil) return null;
  return {
    id: auth.user.id,
    email: auth.user.email ?? "",
    nama: profil.nama,
    peran: profil.peran as Peran,
    puskesmasId: profil.puskesmas_id,
  };
});

/** Wajib masuk dengan salah satu peran; selain itu dialihkan ke halaman masuk atau beranda perannya. */
export async function wajibPeran(...peran: Peran[]): Promise<Pengguna> {
  const pengguna = await getPengguna();
  if (!pengguna) redirect("/masuk");
  if (!peran.includes(pengguna.peran)) redirect(BERANDA[pengguna.peran]);
  return pengguna;
}
