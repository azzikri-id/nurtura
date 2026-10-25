import { createClient } from "@/lib/supabase/server";
import { kategoriBBTB, kategoriBBU, kategoriTBU, umurHari, type JenisKelamin } from "@/lib/gizi";
import type { Tingkat } from "@/lib/gizi/kategori";
import { hariIniWIB } from "@/lib/format";

export type KonteksAnak = {
  id: string;
  umurBulan: number;
  jenisKelamin: JenisKelamin;
  namaDiketahui: string[];      // untuk disaring dari teks sebelum dikirim ke AI
  status: { nama: string; label: string; tingkat: Tingkat }[];
};

/**
 * Data anak yang BOLEH dikirim ke model AI: umur, jenis kelamin, status gizi. Nama hanya dipakai
 * untuk penyaringan. Akses dijaga RLS: null bila pengguna tidak berhak atas anak ini.
 */
export async function konteksAnak(anakId: string): Promise<KonteksAnak | null> {
  const supabase = await createClient();
  const { data: a } = await supabase
    .from("anak")
    .select("id, nama, tgl_lahir, jenis_kelamin, keluarga(nama_ibu, nama_ayah), pengukuran(tgl_ukur, status_gizi(z_bbu, z_tbu, z_bbtb))")
    .eq("id", anakId)
    .order("tgl_ukur", { referencedTable: "pengukuran", ascending: false })
    .order("dibuat_pada", { referencedTable: "pengukuran", ascending: false })
    .limit(1, { referencedTable: "pengukuran" })
    .maybeSingle();
  if (!a) return null;
  const kel = a.keluarga as unknown as { nama_ibu: string; nama_ayah: string | null } | null;
  const ukur = a.pengukuran?.[0];
  const s = ukur ? (Array.isArray(ukur.status_gizi) ? ukur.status_gizi[0] : ukur.status_gizi) : null;
  const status: KonteksAnak["status"] = [];
  if (s?.z_tbu != null) status.push({ nama: "Tinggi menurut umur", ...kategoriTBU(Number(s.z_tbu)) });
  if (s?.z_bbtb != null) status.push({ nama: "Berat menurut tinggi", ...kategoriBBTB(Number(s.z_bbtb)) });
  if (s?.z_bbu != null) status.push({ nama: "Berat menurut umur", ...kategoriBBU(Number(s.z_bbu)) });
  return {
    id: a.id,
    umurBulan: Math.floor(umurHari(a.tgl_lahir, hariIniWIB()) / 30.4375),
    jenisKelamin: a.jenis_kelamin,
    namaDiketahui: [a.nama, kel?.nama_ibu ?? "", kel?.nama_ayah ?? ""].filter(Boolean),
    status,
  };
}

export const ringkasProfil = (k: KonteksAnak) =>
  `Umur ${k.umurBulan} bulan, ${k.jenisKelamin === "L" ? "laki-laki" : "perempuan"}. ` +
  (k.status.length ? `Status gizi terakhir: ${k.status.map((s) => `${s.nama} ${s.label}`).join("; ")}.` : "Belum ada data penimbangan.");

/** Jumlah permintaan AI pengguna dalam satu jam terakhir pada tabel tertentu (untuk rate limit). */
export async function jumlahSejamTerakhir(tabel: "percakapan_ai" | "rekomendasi_menu", userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from(tabel)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("dibuat_pada", new Date(Date.now() - 3_600_000).toISOString());
  return count ?? 0;
}
