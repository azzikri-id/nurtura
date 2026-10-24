"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { wajibPeran } from "@/lib/auth";
import { posyanduSaya } from "@/lib/data/kader";
import { enkripsi } from "@/lib/enkripsi";
import { hariIniWIB } from "@/lib/format";
import { UMUR_MAKS_HARI, umurHari } from "@/lib/gizi";

export type StatusDaftar = { galat?: Record<string, string>; nilai?: Record<string, string> };

const opsional = (s: z.ZodString) => z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), s.optional());

const Skema = z.object({
  posyanduId: z.uuid("Pilih posyandu"),
  nama: z.string().trim().min(1, "Isi nama anak").max(120),
  tglLahir: z.iso.date({ error: "Isi tanggal lahir" }),
  jenisKelamin: z.enum(["L", "P"], { error: "Pilih jenis kelamin" }),
  namaIbu: z.string().trim().min(2, "Isi nama ibu").max(120),
  namaAyah: opsional(z.string().trim().max(120)),
  alamat: opsional(z.string().trim().max(300)),
  nik: opsional(z.string().trim().regex(/^\d{16}$/, "NIK harus 16 digit angka")),
  setuju: z.literal("ya", { error: "Orang tua harus menyetujui sebelum data disimpan" }),
});

// File "use server" hanya boleh mengekspor fungsi async, jadi konstanta ini tidak diekspor.
const VERSI_KEBIJAKAN = "2026-10";

export async function daftarkanAnak(_: StatusDaftar, form: FormData): Promise<StatusDaftar> {
  const kader = await wajibPeran("kader");
  const nilai = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const hasil = Skema.safeParse(nilai);
  if (!hasil.success) {
    const galat: Record<string, string> = {};
    for (const i of hasil.error.issues) galat[String(i.path[0])] ??= i.message;
    return { galat, nilai };
  }
  const d = hasil.data;
  const umur = umurHari(d.tglLahir, hariIniWIB());
  if (umur < 0) return { galat: { tglLahir: "Tanggal lahir tidak boleh di masa depan" }, nilai };
  if (umur > UMUR_MAKS_HARI) return { galat: { tglLahir: "Nurtura untuk anak usia 0–60 bulan" }, nilai };
  if (!(await posyanduSaya(kader.id)).some((p) => p.id === d.posyanduId)) {
    return { galat: { posyanduId: "Anda tidak bertugas di posyandu ini" }, nilai };
  }

  const supabase = await createClient();
  const { data: kel, error: e1 } = await supabase
    .from("keluarga")
    .insert({ posyandu_id: d.posyanduId, nama_ibu: d.namaIbu, nama_ayah: d.namaAyah ?? null, alamat: d.alamat ?? null, dibuat_oleh: kader.id })
    .select("id")
    .single();
  if (e1 || !kel) return { galat: { umum: "Gagal menyimpan data keluarga." }, nilai };

  await supabase.from("persetujuan").insert({ keluarga_id: kel.id, versi_kebijakan: VERSI_KEBIJAKAN, dicatat_oleh: kader.id });

  const { data: anak, error: e2 } = await supabase
    .from("anak")
    .insert({
      keluarga_id: kel.id, posyandu_id: d.posyanduId, nama: d.nama, tgl_lahir: d.tglLahir,
      jenis_kelamin: d.jenisKelamin, nik_terenkripsi: d.nik ? enkripsi(d.nik) : null,
    })
    .select("id")
    .single();
  if (e2 || !anak) return { galat: { umum: "Gagal menyimpan data anak." }, nilai };

  await supabase.from("audit_log").insert({ user_id: kader.id, aksi: "tambah", tabel: "anak", record_id: anak.id });
  redirect(`/kader/anak/${anak.id}`);
}
