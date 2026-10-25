"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { wajibPeran } from "@/lib/auth";
import { cekKewajaran, cekPeringatan, hitungStatusGizi, umurHari, UMUR_MAKS_HARI, type MasalahInput, type Titik } from "@/lib/gizi";
import { hariIniWIB } from "@/lib/format";

export type StatusSimpan = {
  galat?: Record<string, string>;
  masalah?: MasalahInput[];     // data tidak wajar: kader perlu konfirmasi + alasan
  berhasil?: { tglUkur: string; peringatan: number };
  nilai?: Record<string, string>;
};

const angka = z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v), z.number({ error: "Isi dengan angka" }));

const Skema = z.object({
  tglUkur: z.iso.date({ error: "Tanggal tidak valid" }),
  beratKg: angka.pipe(z.number().min(0.5, "Berat minimal 0,5 kg").max(40, "Berat maksimal 40 kg")),
  tinggiCm: angka.pipe(z.number().min(35, "Panjang minimal 35 cm").max(130, "Tinggi maksimal 130 cm")),
  caraUkur: z.enum(["terlentang", "berdiri"], { error: "Pilih cara ukur" }),
  lingkarKepalaCm: z.preprocess((v) => (v === "" || v === null ? undefined : v), angka.pipe(z.number().min(25).max(60)).optional()),
  konfirmasi: z.literal("ya").optional(),
  alasan: z.string().trim().max(300).optional(),
});

export async function simpanPengukuran(anakId: string, _: StatusSimpan, form: FormData): Promise<StatusSimpan> {
  const kader = await wajibPeran("kader");
  const nilai = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const hasil = Skema.safeParse(nilai);
  if (!hasil.success) {
    const galat: Record<string, string> = {};
    for (const i of hasil.error.issues) galat[String(i.path[0])] ??= i.message;
    return { galat, nilai };
  }
  const d = hasil.data;
  if (d.tglUkur > hariIniWIB()) return { galat: { tglUkur: "Tanggal ukur tidak boleh di masa depan" }, nilai };

  const supabase = await createClient();
  // RLS menjamin kader hanya bisa membaca anak di posyandunya.
  const { data: anak } = await supabase
    .from("anak")
    .select("id, tgl_lahir, jenis_kelamin, pengukuran(tgl_ukur, umur_hari, berat_kg, tinggi_cm, cara_ukur, status_gizi(z_bbu, z_tbu, z_bbtb))")
    .eq("id", anakId)
    .order("tgl_ukur", { referencedTable: "pengukuran", ascending: true })
    .order("dibuat_pada", { referencedTable: "pengukuran", ascending: true })
    .maybeSingle();
  if (!anak) return { galat: { umum: "Anak tidak ditemukan atau bukan di posyandu Anda." }, nilai };

  const hari = umurHari(anak.tgl_lahir, d.tglUkur);
  if (hari < 0 || hari > UMUR_MAKS_HARI) return { galat: { tglUkur: "Umur anak di luar 0–60 bulan pada tanggal ini" }, nilai };

  const status = hitungStatusGizi({
    tglLahir: anak.tgl_lahir, tglUkur: d.tglUkur, jenisKelamin: anak.jenis_kelamin,
    beratKg: d.beratKg, tinggiCm: d.tinggiCm, caraUkur: d.caraUkur,
  });
  const riwayat: Titik[] = (anak.pengukuran ?? []).map((p) => {
    const s = Array.isArray(p.status_gizi) ? p.status_gizi[0] : p.status_gizi;
    const tinggi = Number(p.tinggi_cm);
    return {
      tglUkur: p.tgl_ukur, umurHari: p.umur_hari, beratKg: Number(p.berat_kg),
      // tinggi dikoreksi cara ukur, sama seperti saat perhitungan status
      tinggiCm: p.umur_hari < 731 && p.cara_ukur === "berdiri" ? tinggi + 0.7 : p.umur_hari >= 731 && p.cara_ukur === "terlentang" ? tinggi - 0.7 : tinggi,
      zBBU: s?.z_bbu ?? null, zTBU: s?.z_tbu ?? null, zBBTB: s?.z_bbtb ?? null,
    };
  });
  const baru: Titik = {
    tglUkur: d.tglUkur, umurHari: hari, beratKg: d.beratKg, tinggiCm: status.tinggiTerkoreksiCm,
    zBBU: status.bbu?.z ?? null, zTBU: status.tbu?.z ?? null, zBBTB: status.bbtb?.z ?? null,
    tingkatBBU: status.bbu?.kategori.tingkat, tingkatTBU: status.tbu?.kategori.tingkat, tingkatBBTB: status.bbtb?.kategori.tingkat,
  };

  const masalah = cekKewajaran(baru, riwayat[riwayat.length - 1] ?? null);
  if (masalah.length && d.konfirmasi !== "ya") return { masalah, nilai };
  if (masalah.length && !d.alasan) return { masalah, nilai, galat: { alasan: "Tuliskan alasan data tetap disimpan" } };

  const { data: ukur, error } = await supabase
    .from("pengukuran")
    .insert({
      anak_id: anakId, kader_id: kader.id, tgl_ukur: d.tglUkur, umur_hari: hari,
      berat_kg: d.beratKg, tinggi_cm: d.tinggiCm, cara_ukur: d.caraUkur,
      lingkar_kepala_cm: d.lingkarKepalaCm ?? null, catatan_koreksi: masalah.length ? d.alasan : null,
    })
    .select("id")
    .single();
  if (error || !ukur) return { galat: { umum: "Gagal menyimpan. Coba lagi." }, nilai };

  await supabase.from("status_gizi").insert({
    pengukuran_id: ukur.id,
    z_bbu: status.bbu?.z ?? null, z_tbu: status.tbu?.z ?? null, z_bbtb: status.bbtb?.z ?? null,
    kategori_bbu: status.bbu?.kategori.label ?? null, kategori_tbu: status.tbu?.kategori.label ?? null,
    kategori_bbtb: status.bbtb?.kategori.label ?? null,
  });

  const urut = [...riwayat, baru].sort((a, b) => a.umurHari - b.umurHari);
  const peringatan = urut[urut.length - 1] === baru ? cekPeringatan(urut) : [];
  if (peringatan.length) {
    await supabase.from("peringatan").insert(peringatan.map((p) => ({
      anak_id: anakId, pengukuran_id: ukur.id, jenis: p.jenis, tingkat: p.tingkat, catatan_tindak_lanjut: p.pesan,
    })));
  }
  await supabase.from("audit_log").insert({ user_id: kader.id, aksi: "tambah", tabel: "pengukuran", record_id: ukur.id });

  revalidatePath(`/kader/anak/${anakId}`);
  revalidatePath("/kader");
  return { berhasil: { tglUkur: d.tglUkur, peringatan: peringatan.length } };
}
