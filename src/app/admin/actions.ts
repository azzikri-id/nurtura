"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { wajibPeran } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type StatusAdmin = {
  galat?: string;
  fields?: Record<string, string>;
  berhasil?: string;
  /** Kata sandi sementara; hanya ditampilkan sekali di layar ini dan tidak disimpan di mana pun. */
  sandi?: { email: string; sandi: string };
};

const sandiBaru = () => randomBytes(9).toString("base64url");
/** Akun demo dipakai bersama oleh juri; admin tidak boleh mengubah kata sandi atau menonaktifkannya. */
const akunDemo = (email?: string | null) => /@example\.(com|org|net)$/i.test(email ?? "");
const galatField = (e: z.ZodError) => {
  const fields: Record<string, string> = {};
  for (const i of e.issues) fields[String(i.path[0])] ??= i.message;
  return fields;
};

const SkemaPosyandu = z.object({
  nama: z.string().trim().min(2, "Isi nama posyandu").max(120, "Nama maksimal 120 karakter"),
  alamat: z.string().trim().max(200, "Alamat maksimal 200 karakter").optional(),
  puskesmasId: z.uuid({ error: "Pilih puskesmas" }),
  wilayahId: z.uuid({ error: "Pilih desa/kelurahan" }),
});

export async function tambahPosyandu(_: StatusAdmin, form: FormData): Promise<StatusAdmin> {
  const admin = await wajibPeran("admin");
  const hasil = SkemaPosyandu.safeParse({
    nama: form.get("nama"), alamat: String(form.get("alamat") ?? "") || undefined,
    puskesmasId: form.get("puskesmasId"), wilayahId: form.get("wilayahId"),
  });
  if (!hasil.success) return { fields: galatField(hasil.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("posyandu").insert({
    nama: hasil.data.nama, alamat: hasil.data.alamat ?? null,
    puskesmas_id: hasil.data.puskesmasId, wilayah_id: hasil.data.wilayahId,
  }).select("id").single();
  if (error || !data) return { galat: "Gagal menambah posyandu. Periksa kembali isian Anda." };

  await supabase.from("audit_log").insert({ user_id: admin.id, aksi: "tambah", tabel: "posyandu", record_id: data.id });
  revalidatePath("/admin");
  return { berhasil: `Posyandu ${hasil.data.nama} ditambahkan.` };
}

const SkemaAkun = z.object({
  nama: z.string().trim().min(2, "Isi nama lengkap").max(120, "Nama maksimal 120 karakter"),
  email: z.email("Format email tidak valid").max(200),
  peran: z.enum(["kader", "bidan"], { error: "Pilih peran" }),
  posyanduId: z.uuid().optional(),
  puskesmasId: z.uuid().optional(),
  sandi: z.string().min(8, "Kata sandi minimal 8 karakter").max(72).optional(),
});

/** Admin membuat akun kader/bidan. Akun langsung aktif; kata sandi sementara ditampilkan sekali. */
export async function buatAkun(_: StatusAdmin, form: FormData): Promise<StatusAdmin> {
  const admin = await wajibPeran("admin");
  const kosong = (k: string) => String(form.get(k) ?? "").trim() || undefined;
  const hasil = SkemaAkun.safeParse({
    nama: form.get("nama"), email: String(form.get("email") ?? "").trim().toLowerCase(), peran: form.get("peran"),
    posyanduId: kosong("posyanduId"), puskesmasId: kosong("puskesmasId"), sandi: kosong("sandi"),
  });
  if (!hasil.success) return { fields: galatField(hasil.error) };
  const d = hasil.data;
  if (d.peran === "kader" && !d.posyanduId) return { fields: { posyanduId: "Pilih posyandu tempat kader bertugas" } };
  if (d.peran === "bidan" && !d.puskesmasId) return { fields: { puskesmasId: "Pilih puskesmas tempat bidan bertugas" } };

  const db = createAdminClient();
  const sandi = d.sandi ?? sandiBaru();
  const { data, error } = await db.auth.admin.createUser({
    email: d.email, password: sandi, email_confirm: true, user_metadata: { nama: d.nama },
  });
  if (error || !data.user) return { galat: "Akun tidak dapat dibuat. Email mungkin sudah terdaftar." };
  const id = data.user.id;

  // Trigger database membuat profil sebagai orang_tua; peran dan penugasan ditetapkan di sini.
  const supabase = await createClient();
  const { error: e1 } = await supabase.from("profiles")
    .update({ peran: d.peran, puskesmas_id: d.peran === "bidan" ? d.puskesmasId : null }).eq("id", id);
  const { error: e2 } = d.peran === "kader"
    ? await supabase.from("kader_posyandu").insert({ kader_id: id, posyandu_id: d.posyanduId! })
    : { error: null };
  if (e1 || e2) {
    await db.auth.admin.deleteUser(id); // batalkan agar tidak ada akun setengah jadi
    return { galat: "Penugasan gagal disimpan, akun dibatalkan. Coba lagi." };
  }

  await supabase.from("audit_log").insert({ user_id: admin.id, aksi: "tambah", tabel: "akun", record_id: id });
  revalidatePath("/admin");
  return { berhasil: `Akun ${d.peran} untuk ${d.nama} dibuat.`, sandi: { email: d.email, sandi } };
}

/** Target aksi hanya akun kader/bidan non-demo. */
async function targetStaf(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const db = createAdminClient();
  const [{ data: u }, { data: p }] = await Promise.all([
    db.auth.admin.getUserById(id),
    db.from("profiles").select("peran, nama").eq("id", id).single(),
  ]);
  if (!u.user || !p || (p.peran !== "kader" && p.peran !== "bidan")) return null;
  return { db, email: u.user.email ?? "", nama: p.nama };
}

/** Pengganti "lupa kata sandi": admin mengatur ulang dan menyerahkan kata sandi sementara. */
export async function aturUlangSandi(id: string): Promise<StatusAdmin> {
  const admin = await wajibPeran("admin");
  const t = await targetStaf(id);
  if (!t) return { galat: "Akun tidak ditemukan." };
  if (akunDemo(t.email)) return { galat: "Akun demo tidak dapat diubah agar tetap bisa dipakai pengunjung." };

  const sandi = sandiBaru();
  const { error } = await t.db.auth.admin.updateUserById(id, { password: sandi });
  if (error) return { galat: "Gagal mengatur ulang kata sandi." };
  await (await createClient()).from("audit_log").insert({ user_id: admin.id, aksi: "ubah", tabel: "akun", record_id: id });
  return { berhasil: `Kata sandi ${t.nama} diatur ulang.`, sandi: { email: t.email, sandi } };
}

/** Nonaktifkan atau aktifkan kembali akun. Akun nonaktif tidak bisa masuk; sesi yang berjalan habis maksimal 1 jam. */
export async function ubahStatusAkun(id: string, aktif: boolean): Promise<StatusAdmin> {
  const admin = await wajibPeran("admin");
  const t = await targetStaf(id);
  if (!t) return { galat: "Akun tidak ditemukan." };
  if (akunDemo(t.email)) return { galat: "Akun demo tidak dapat diubah agar tetap bisa dipakai pengunjung." };

  const { error } = await t.db.auth.admin.updateUserById(id, { ban_duration: aktif ? "none" : "876000h" });
  if (error) return { galat: "Gagal mengubah status akun." };
  await (await createClient()).from("audit_log").insert({ user_id: admin.id, aksi: "ubah", tabel: "akun", record_id: id });
  revalidatePath("/admin");
  return { berhasil: `Akun ${t.nama} ${aktif ? "diaktifkan kembali" : "dinonaktifkan"}.` };
}
