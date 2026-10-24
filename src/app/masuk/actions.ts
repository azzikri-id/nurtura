"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

async function masukDengan(email: string, password: string, lanjut: string | null): Promise<StatusMasuk> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.status === 429) {
    return { galat: "Terlalu banyak percobaan masuk. Tunggu beberapa menit lalu coba lagi.", email };
  }
  if (error || !data.user) {
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
  return masukDengan(akun.email, PASSWORD_DEMO, null);
}

export async function keluar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/masuk");
}
