import { createClient } from "@/lib/supabase/server";
import { getPengguna } from "@/lib/auth";
import { dekripsi } from "@/lib/enkripsi";

/**
 * GET /api/v1/anak/{id}/ekspor — salinan data anak (hak subjek data, UU PDP).
 * Hanya pengguna yang berhak atas anak ini (dijaga RLS) yang mendapat data.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/v1/anak/[id]/ekspor">) {
  const pengguna = await getPengguna();
  if (!pengguna) return Response.json({ error: { code: "UNAUTHORIZED", message: "Silakan masuk" } }, { status: 401 });
  const { id } = await params;

  const supabase = await createClient();
  const { data: a } = await supabase
    .from("anak")
    .select(`nama, tgl_lahir, jenis_kelamin, nik_terenkripsi, dibuat_pada, posyandu(nama),
      keluarga(nama_ibu, nama_ayah, alamat, persetujuan(versi_kebijakan, disetujui_pada)),
      pengukuran(tgl_ukur, umur_hari, berat_kg, tinggi_cm, cara_ukur, lingkar_kepala_cm,
        status_gizi(z_bbu, z_tbu, z_bbtb, kategori_bbu, kategori_tbu, kategori_bbtb)),
      peringatan(jenis, tingkat, status, catatan_tindak_lanjut, dibuat_pada),
      imunisasi(jenis_vaksin, tgl_diberikan)`)
    .eq("id", id)
    .order("tgl_ukur", { referencedTable: "pengukuran", ascending: true })
    .maybeSingle();
  if (!a) return Response.json({ error: { code: "NOT_FOUND", message: "Data anak tidak ditemukan" } }, { status: 404 });

  // NIK ditampilkan tersamar; bentuk utuhnya hanya bisa dilihat di posyandu.
  let nik: string | null = null;
  if (a.nik_terenkripsi) {
    try { nik = `************${dekripsi(a.nik_terenkripsi).slice(-4)}`; } catch { nik = "(tidak dapat dibuka)"; }
  }
  const anak = { ...a, nik_terenkripsi: undefined }; // sandi NIK tidak ikut diekspor

  await supabase.from("audit_log").insert({ user_id: pengguna.id, aksi: "ekspor", tabel: "anak", record_id: id });

  const isi = { diekspor_pada: new Date().toISOString(), sumber: "Nurtura", anak: { ...anak, nik } };
  const namaFile = `nurtura-${a.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  return new Response(JSON.stringify(isi, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${namaFile}"`,
      "Cache-Control": "no-store",
    },
  });
}
