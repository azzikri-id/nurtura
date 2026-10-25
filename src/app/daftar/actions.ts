"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type StatusDaftar = { galat?: string; fields?: Record<string, string>; nilai?: { nama: string; email: string } };

const BATAS_PER_JAM = 10; // per alamat IP; kampus dan warnet sering berbagi satu IP

const Skema = z.object({
  nama: z.string().trim().min(2, "Isi nama lengkap").max(120, "Nama maksimal 120 karakter"),
  email: z.email("Format email tidak valid").max(200, "Email terlalu panjang")
    .refine((e) => !/@example\.(com|org|net)$/i.test(e), "Gunakan email aktif Anda"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72, "Kata sandi maksimal 72 karakter"),
  setuju: z.literal("ya", { error: "Centang persetujuan untuk melanjutkan" }),
});

/** Pendaftaran akun orang tua. Peran selalu orang_tua (ditetapkan trigger database), bukan dari input. */
export async function daftar(_: StatusDaftar, form: FormData): Promise<StatusDaftar> {
  const mentah = { nama: String(form.get("nama") ?? ""), email: String(form.get("email") ?? "").trim().toLowerCase() };
  const hasil = Skema.safeParse({ ...mentah, password: form.get("password"), setuju: form.get("setuju") });
  if (!hasil.success) {
    const fields: Record<string, string> = {};
    for (const i of hasil.error.issues) fields[String(i.path[0])] ??= i.message;
    return { fields, nilai: mentah };
  }
  const { nama, email, password } = hasil.data;
  if (password.toLowerCase() === email) return { fields: { password: "Kata sandi tidak boleh sama dengan email" }, nilai: mentah };

  // Batas pendaftaran per IP; IP disimpan sebagai hash agar log tidak memuat data pribadi.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "tanpa-ip";
  const kunci = createHash("sha256").update(`daftar:${ip}`).digest("hex");
  const db = createAdminClient();
  const sejak = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from("audit_log").select("id", { count: "exact", head: true })
    .eq("aksi", "daftar").eq("record_id", kunci).gte("waktu", sejak);
  if ((count ?? 0) >= BATAS_PER_JAM) {
    return { galat: "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi dalam satu jam.", nilai: mentah };
  }

  const { data, error } = await db.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { nama },
  });
  if (error || !data.user) {
    // Pesan netral agar halaman ini tidak bisa dipakai untuk menebak email yang sudah terdaftar.
    return { galat: "Pendaftaran tidak dapat diproses dengan data ini. Bila Anda sudah punya akun, silakan masuk.", nilai: mentah };
  }
  await db.from("audit_log").insert({ user_id: data.user.id, aksi: "daftar", tabel: "auth", record_id: kunci });

  const { error: galatMasuk } = await (await createClient()).auth.signInWithPassword({ email, password });
  redirect(galatMasuk ? "/masuk" : "/orang-tua");
}
