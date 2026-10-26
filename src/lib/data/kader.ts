import { createClient } from "@/lib/supabase/server";
import type { Tingkat } from "@/lib/gizi/kategori";
import { kategoriBBTB, kategoriBBU, kategoriTBU } from "@/lib/gizi";

export type StatusRingkas = { z: number; label: string; tingkat: Tingkat } | null;

export type Pengukuran = {
  id: string;
  tglUkur: string;
  umurHari: number;
  beratKg: number;
  tinggiCm: number;
  caraUkur: "terlentang" | "berdiri";
  catatanKoreksi: string | null;
  bbu: StatusRingkas;
  tbu: StatusRingkas;
  bbtb: StatusRingkas;
};

export type PeringatanAnak = {
  id: string;
  jenis: string;
  tingkat: "bahaya" | "waspada" | "perhatian";
  status: "baru" | "ditindaklanjuti" | "selesai";
  catatan: string | null;
  dibuatPada: string;
};

type BarisStatus = { z_bbu: number | null; z_tbu: number | null; z_bbtb: number | null } | null;

/** Label dan tingkat dihitung ulang dari z yang tersimpan, agar konsisten dengan modul kategori. */
function ringkas(s: BarisStatus) {
  const r = (z: number | null | undefined, kat: (z: number) => { label: string; tingkat: Tingkat }): StatusRingkas =>
    z === null || z === undefined ? null : { z: Number(z), ...kat(Number(z)) };
  return { bbu: r(s?.z_bbu, kategoriBBU), tbu: r(s?.z_tbu, kategoriTBU), bbtb: r(s?.z_bbtb, kategoriBBTB) };
}

type BarisUkur = {
  id: string; tgl_ukur: string; umur_hari: number; berat_kg: number; tinggi_cm: number;
  cara_ukur: "terlentang" | "berdiri"; catatan_koreksi: string | null;
  status_gizi: BarisStatus | BarisStatus[];
};

export function petakanUkur(u: BarisUkur): Pengukuran {
  const s = Array.isArray(u.status_gizi) ? u.status_gizi[0] ?? null : u.status_gizi;
  return {
    id: u.id, tglUkur: u.tgl_ukur, umurHari: u.umur_hari, beratKg: Number(u.berat_kg), tinggiCm: Number(u.tinggi_cm),
    caraUkur: u.cara_ukur, catatanKoreksi: u.catatan_koreksi, ...ringkas(s),
  };
}

const KOLOM_UKUR = "id, tgl_ukur, umur_hari, berat_kg, tinggi_cm, cara_ukur, catatan_koreksi, status_gizi(z_bbu, z_tbu, z_bbtb)";

/** Posyandu tempat kader ini bertugas. */
export async function posyanduSaya(kaderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kader_posyandu")
    .select("posyandu(id, nama, alamat)")
    .eq("kader_id", kaderId);
  return (data ?? []).flatMap((r) => (r.posyandu ? [r.posyandu as unknown as { id: string; nama: string; alamat: string | null }] : []));
}

export type AnakRingkas = {
  id: string; nama: string; tglLahir: string; jenisKelamin: "L" | "P"; namaIbu: string; posyanduNama: string;
  terakhir: Pengukuran | null; peringatanAktif: PeringatanAnak[];
};

/** Daftar anak yang terlihat oleh pengguna (RLS membatasi sesuai peran), beserta pengukuran terakhirnya. */
export async function daftarAnak(cari?: string): Promise<AnakRingkas[]> {
  const supabase = await createClient();
  let q = supabase
    .from("anak")
    .select(`id, nama, tgl_lahir, jenis_kelamin, keluarga(nama_ibu), posyandu(nama),
      pengukuran(${KOLOM_UKUR}),
      peringatan(id, jenis, tingkat, status, catatan_tindak_lanjut, dibuat_pada)`)
    .eq("aktif", true)
    .order("nama")
    .order("tgl_ukur", { referencedTable: "pengukuran", ascending: false })
    .order("dibuat_pada", { referencedTable: "pengukuran", ascending: false })
    .limit(1, { referencedTable: "pengukuran" });
  if (cari) q = q.ilike("nama", `%${cari.replace(/[%_]/g, "")}%`);
  const { data, error } = await q;
  // Firewall di depan database dapat membalas dengan halaman HTML bila kata kunci menyerupai serangan; anggap tidak ada hasil.
  if (error && cari && /<!doctype|<html/i.test(error.message)) return [];
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({
    id: a.id, nama: a.nama, tglLahir: a.tgl_lahir, jenisKelamin: a.jenis_kelamin,
    namaIbu: (a.keluarga as unknown as { nama_ibu: string } | null)?.nama_ibu ?? "",
    posyanduNama: (a.posyandu as unknown as { nama: string } | null)?.nama ?? "",
    terakhir: a.pengukuran?.[0] ? petakanUkur(a.pengukuran[0] as BarisUkur) : null,
    peringatanAktif: (a.peringatan ?? [])
      .filter((p) => p.status !== "selesai")
      .map((p) => ({ id: p.id, jenis: p.jenis, tingkat: p.tingkat, status: p.status, catatan: p.catatan_tindak_lanjut, dibuatPada: p.dibuat_pada })),
  }));
}

export type DetailAnak = AnakRingkas & {
  namaAyah: string | null; kodeUndangan: string; riwayat: Pengukuran[];
};

export async function detailAnak(id: string): Promise<DetailAnak | null> {
  const supabase = await createClient();
  const { data: a } = await supabase
    .from("anak")
    .select(`id, nama, tgl_lahir, jenis_kelamin, posyandu(nama),
      keluarga(nama_ibu, nama_ayah, kode_undangan),
      pengukuran(${KOLOM_UKUR}),
      peringatan(id, jenis, tingkat, status, catatan_tindak_lanjut, dibuat_pada)`)
    .eq("id", id)
    .order("tgl_ukur", { referencedTable: "pengukuran", ascending: true })
    .order("dibuat_pada", { referencedTable: "pengukuran", ascending: true })
    .order("dibuat_pada", { referencedTable: "peringatan", ascending: false })
    .maybeSingle();
  if (!a) return null;
  const kel = a.keluarga as unknown as { nama_ibu: string; nama_ayah: string | null; kode_undangan: string } | null;
  const riwayat = (a.pengukuran ?? []).map((u) => petakanUkur(u as BarisUkur));
  return {
    id: a.id, nama: a.nama, tglLahir: a.tgl_lahir, jenisKelamin: a.jenis_kelamin,
    namaIbu: kel?.nama_ibu ?? "", namaAyah: kel?.nama_ayah ?? null, kodeUndangan: kel?.kode_undangan ?? "",
    posyanduNama: (a.posyandu as unknown as { nama: string } | null)?.nama ?? "",
    riwayat, terakhir: riwayat[riwayat.length - 1] ?? null,
    peringatanAktif: (a.peringatan ?? [])
      .filter((p) => p.status !== "selesai")
      .map((p) => ({ id: p.id, jenis: p.jenis, tingkat: p.tingkat, status: p.status, catatan: p.catatan_tindak_lanjut, dibuatPada: p.dibuat_pada })),
  };
}
