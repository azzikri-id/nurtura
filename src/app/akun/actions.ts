"use server";

import { z } from "zod";
import { getPengguna } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type StatusSandi = { galat?: string; fields?: Record<string, string>; berhasil?: boolean };

const Skema = z.object({
  lama: z.string().min(1, "Isi kata sandi saat ini"),
  baru: z.string().min(8, "Kata sandi baru minimal 8 karakter").max(72, "Kata sandi maksimal 72 karakter"),
});

/** Ganti kata sandi sendiri. Kata sandi lama diperiksa dulu agar sesi yang tertinggal tidak bisa mengambil alih akun. */
export async function gantiSandi(_: StatusSandi, form: FormData): Promise<StatusSandi> {
  const pengguna = await getPengguna();
  if (!pengguna) return { galat: "Silakan masuk kembali." };
  if (/@example\.(com|org|net)$/i.test(pengguna.email)) {
    return { galat: "Akun demo dipakai bersama pengunjung, jadi kata sandinya tidak dapat diganti." };
  }

  const hasil = Skema.safeParse({ lama: form.get("lama"), baru: form.get("baru") });
  if (!hasil.success) {
    const fields: Record<string, string> = {};
    for (const i of hasil.error.issues) fields[String(i.path[0])] ??= i.message;
    return { fields };
  }
  if (hasil.data.lama === hasil.data.baru) return { fields: { baru: "Kata sandi baru harus berbeda dari yang lama" } };

  const supabase = await createClient();
  const { error: salah } = await supabase.auth.signInWithPassword({ email: pengguna.email, password: hasil.data.lama });
  if (salah) return { fields: { lama: "Kata sandi saat ini salah" } };

  const { error } = await supabase.auth.updateUser({ password: hasil.data.baru });
  if (error) return { galat: "Gagal mengganti kata sandi. Coba lagi." };
  await supabase.from("audit_log").insert({ user_id: pengguna.id, aksi: "ubah", tabel: "akun", record_id: pengguna.id });
  return { berhasil: true };
}
