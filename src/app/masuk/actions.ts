"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { BERANDA, type Peran } from "@/lib/auth";
import { AKUN_DEMO, PASSWORD_DEMO } from "@/lib/demo";

export type StatusMasuk = { galat?: string; email?: string };

const Skema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

/** Hanya izinkan tujuan internal agar parameter `lanjut` tidak bisa dipakai untuk open redirect. */
const tujuanAman = (lanjut: FormDataEntryValue | null) =>
  typeof lanjut === "string" && /^\/(kader|bidan|orang-tua|admin)(\/|$)/.test(lanjut) ? lanjut : null;

const BATAS_GAGAL = 5;
const JENDELA_MENIT = 15;
const PESAN_TERKUNCI = "Terlalu banyak percobaan masuk. Tunggu beberapa menit lalu coba lagi.";

/** Email disimpan sebagai hash agar log percobaan gagal tidak memuat data pribadi. */
const kunciEmail = (email: string) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

async function jumlahGagal(kunci: string) {
  const sejak = new Date(Date.now() - JENDELA_MENIT * 60_000).toISOString();
  const { count } = await createAdminClient().from("audit_log").select("id", { count: "exact", head: true })
    .eq("aksi", "gagal_masuk").eq("record_id", kunci).gte("waktu", sejak);
  return count ?? 0;
}

async function masukDengan(email: string, password: string, lanjut: string | null, batasi = true): Promise<StatusMasuk> {
  // Batas 5 kali gagal per 15 menit per email, di atas batas bawaan Supabase Auth.
  const kunci = kunciEmail(email);
  if (batasi && (await jumlahGagal(kunci)) >= BATAS_GAGAL) return { galat: PESAN_TERKUNCI, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.status === 429) return { galat: PESAN_TERKUNCI, email };
  if (error || !data.user) {
    if (batasi) await createAdminClient().from("audit_log").insert({ aksi: "gagal_masuk", tabel: "auth", record_id: kunci });
    // Pesan sama untuk email tidak terdaftar dan sandi salah, agar tidak membocorkan akun yang ada.
    return { galat: "Email atau kata sandi salah.", email };
  }
  const { data: profil } = await supabase.from("profiles").select("peran").eq("id", data.user.id).single();
  const beranda = BERANDA[(profil?.peran ?? "orang_tua") as Peran];
  redirect(lanjut && lanjut.startsWith(beranda) ? lanjut : beranda);
}

export async function masuk(_: StatusMasuk, form: FormData): Promise<StatusMasuk> {
  const hasil = Skema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!hasil.success) {
    return { galat: hasil.error.issues[0].message, email: String(form.get("email") ?? "") };
  }
  return masukDengan(hasil.data.email, hasil.data.password, tujuanAman(form.get("lanjut")));
}

export async function masukDemo(peran: Peran): Promise<StatusMasuk> {
  const akun = AKUN_DEMO.find((a) => a.peran === peran);
  if (!akun) return { galat: "Akun demo tidak ditemukan." };
  // Tombol demo tidak dibatasi agar akun demo juri tidak bisa dikunci orang lain lewat sandi salah.
  return masukDengan(akun.email, PASSWORD_DEMO, null, false);
}

export async function keluar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/masuk");
}
