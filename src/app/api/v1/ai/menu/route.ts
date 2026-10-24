import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createClient } from "@/lib/supabase/server";
import { getPengguna } from "@/lib/auth";
import { claude, FALLBACK, GalatAI, MODEL, terjemahkanGalat } from "@/lib/ai/claude";
import { jumlahSejamTerakhir, konteksAnak, ringkasProfil } from "@/lib/ai/konteks";
import { SkemaMenu, teksturSesuai, validasiMenu, type HasilValidasi, type MenuAI } from "@/lib/gizi/menu";

const BATAS_PER_JAM = 15; // per akun; akun demo dipakai bersama oleh juri

const Skema = z.object({
  anakId: z.uuid(),
  bahan: z.array(z.string().max(60)).min(1, "Pilih minimal satu bahan").max(15),
  budget: z.number().int().min(1000).max(200_000).optional(),
});

const SISTEM = `Kamu menyusun menu MPASI / makan anak sehari untuk keluarga Indonesia dengan bahan lokal dan murah.
Aturan wajib:
- Utamakan bahan yang dipilih orang tua; boleh menambah air, minyak, dan bumbu alami (bawang, daun salam).
- Untuk anak di bawah 12 bulan: tanpa garam, gula, kecap, penyedap, dan madu.
- Tekstur harus sesuai umur yang diberikan.
- Bila diminta protein hewani, setiap menu makan utama (pagi, siang, sore) wajib memakai salah satu bahan hewani yang dipilih.
- Hindari makanan yang berisiko membuat tersedak.
- Hitung perkiraan biaya per menu (rupiah, bilangan bulat) dari harga per 100 g yang diberikan.
- Tulis nama bahan persis seperti di daftar.
Buat 3 menu makan utama (pagi, siang, sore) dan 1 selingan, dengan cara masak singkat dan alasan gizi satu kalimat.`;

export async function POST(request: Request) {
  const pengguna = await getPengguna();
  if (!pengguna) return galat(401, "UNAUTHORIZED", "Silakan masuk terlebih dahulu");

  const hasil = Skema.safeParse(await request.json().catch(() => null));
  if (!hasil.success) return galat(400, "VALIDATION_ERROR", hasil.error.issues[0].message);
  const { anakId, bahan, budget } = hasil.data;

  const anak = await konteksAnak(anakId);
  if (!anak) return galat(404, "NOT_FOUND", "Data anak tidak ditemukan");
  if (anak.umurBulan < 6) {
    return Response.json({ data: { menu: [], disembunyikan: [], catatan:
      "Anak belum berumur 6 bulan. Cukup ASI saja sampai 6 bulan; MPASI dimulai setelahnya." } });
  }
  if ((await jumlahSejamTerakhir("rekomendasi_menu", pengguna.id)) >= BATAS_PER_JAM) {
    return galat(429, "RATE_LIMITED", "Batas 15 rekomendasi menu per jam tercapai. Coba lagi nanti.");
  }

  const supabase = await createClient();
  const { data: semuaBahan } = await supabase.from("bahan_pangan").select("nama, protein_hewani, harga_perkiraan");
  const daftar = (semuaBahan ?? []).map((b) => ({ nama: b.nama, proteinHewani: b.protein_hewani, harga: b.harga_perkiraan ?? 0 }));
  const dipilih = daftar.filter((d) => bahan.includes(d.nama));
  if (!dipilih.length) return galat(400, "VALIDATION_ERROR", "Bahan tidak dikenal");

  const perluProteinHewani = anak.status.some((s) => s.tingkat === "waspada" || s.tingkat === "bahaya");
  const opsi = { umurBulan: anak.umurBulan, perluProteinHewani, daftarBahan: daftar, budget: budget ? Math.round(budget / 3) : undefined };
  const permintaan =
    `Profil anak: ${ringkasProfil(anak)}\nTekstur yang sesuai: ${teksturSesuai(anak.umurBulan).join(" atau ")}.\n` +
    `Wajib protein hewani di setiap makan utama: ${perluProteinHewani ? "ya" : "tidak (tetap dianjurkan)"}.\n` +
    `${budget ? `Budget sehari: Rp${budget.toLocaleString("id-ID")}.\n` : ""}` +
    `Bahan yang dipilih (harga per 100 g):\n${dipilih.map((d) => `- ${d.nama}: Rp${d.harga}${d.proteinHewani ? " (hewani)" : ""}`).join("\n")}`;

  try {
    let menuAI: MenuAI | null = null;
    let hasilValidasi: HasilValidasi[] = [];
    let umpanBalik = "";
    // Maksimal 2 percobaan: bila ada menu ditolak validasi, minta perbaikan sekali.
    for (let percobaan = 0; percobaan < 2; percobaan++) {
      const res = await claude().beta.messages.parse({
        model: MODEL,
        max_tokens: 4000,
        output_config: { effort: "low", format: betaZodOutputFormat(SkemaMenu) },
        system: SISTEM,
        messages: [{ role: "user", content: permintaan + umpanBalik }],
        ...FALLBACK,
      });
      if (res.stop_reason === "refusal") throw new GalatAI("ditolak", "Asisten tidak dapat menyusun menu ini.");
      menuAI = res.parsed_output;
      if (!menuAI) throw new GalatAI("gagal", "Format menu dari asisten tidak valid.");
      hasilValidasi = menuAI.menu.map((m) => validasiMenu(m, opsi));
      const ditolak = hasilValidasi.filter((h) => h.ditolak.length);
      if (!ditolak.length) break;
      umpanBalik = `\n\nPerbaiki menu berikut yang melanggar aturan:\n${ditolak.map((h) => `- ${h.menu.nama}: ${h.ditolak.join(" ")}`).join("\n")}`;
    }

    const lolos = hasilValidasi.filter((h) => !h.ditolak.length);
    await supabase.from("rekomendasi_menu").insert({
      anak_id: anakId, user_id: pengguna.id, input_bahan: bahan, budget: budget ?? null,
      menu_json: menuAI, lolos_validasi: lolos.length === hasilValidasi.length,
    });
    return Response.json({ data: {
      menu: lolos,
      disembunyikan: hasilValidasi.filter((h) => h.ditolak.length).map((h) => ({ nama: h.menu.nama, alasan: h.ditolak })),
      catatan: menuAI?.catatan ?? "",
    } });
  } catch (e) {
    const g = terjemahkanGalat(e);
    return galat(g.kode === "sibuk" ? 503 : 502, "AI_ERROR", g.message);
  }
}

function galat(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}
