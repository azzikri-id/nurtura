/**
 * Validasi menu MPASI buatan AI sebelum ditampilkan (F11). Model boleh mengusulkan,
 * tapi aturan keamanan di sini yang memutuskan menu layak tampil atau tidak.
 */
import { z } from "zod";

export const Tekstur = z.enum(["lumat", "lembik", "cincang", "keluarga"]);
export type Tekstur = z.infer<typeof Tekstur>;

export const SkemaMenu = z.object({
  menu: z.array(z.object({
    nama: z.string(),
    waktu: z.enum(["pagi", "siang", "sore", "selingan"]),
    bahan: z.array(z.object({ nama: z.string(), takaran: z.string() })),
    caraMasak: z.array(z.string()),
    tekstur: Tekstur,
    alasan: z.string(),
    perkiraanBiaya: z.number().int(),
  })),
  catatan: z.string(),
});
export type MenuAI = z.infer<typeof SkemaMenu>;
export type SatuMenu = MenuAI["menu"][number];

export type BahanPangan = { nama: string; proteinHewani: boolean };

export type HasilValidasi = {
  menu: SatuMenu;
  ditolak: string[];      // alasan menu tidak boleh tampil
  catatan: string[];      // peringatan ringan, menu tetap tampil
};

/** Tekstur yang sesuai umur (pedoman PMBA): 6–8 bln lumat, 9–11 bln lembik/cincang, ≥12 bln makanan keluarga. */
export function teksturSesuai(umurBulan: number): Tekstur[] {
  if (umurBulan < 9) return ["lumat"];
  if (umurBulan < 12) return ["lembik", "cincang"];
  return ["cincang", "keluarga"];
}

const sama = (a: string, b: string) => a.toLowerCase().trim() === b.toLowerCase().trim();
const mengandung = (menu: SatuMenu, kata: RegExp) =>
  kata.test(menu.nama) || menu.bahan.some((b) => kata.test(b.nama)) || menu.caraMasak.some((c) => kata.test(c));

export function validasiMenu(
  menu: SatuMenu,
  opsi: { umurBulan: number; perluProteinHewani: boolean; daftarBahan: BahanPangan[]; budget?: number },
): HasilValidasi {
  const ditolak: string[] = [];
  const catatan: string[] = [];

  if (opsi.umurBulan < 12 && mengandung(menu, /\bmadu\b/i)) {
    ditolak.push("Mengandung madu, tidak boleh untuk anak di bawah 12 bulan (risiko botulisme).");
  }
  if (opsi.umurBulan < 12 && mengandung(menu, /\b(garam|gula|kecap|penyedap|msg|micin)\b/i)) {
    ditolak.push("Memakai garam, gula, atau penyedap tambahan; hindari untuk anak di bawah 12 bulan.");
  }
  if (opsi.umurBulan < 36 && mengandung(menu, /kacang (tanah|mete|almond) utuh|anggur utuh|permen|popcorn/i)) {
    ditolak.push("Mengandung makanan utuh yang berisiko membuat tersedak.");
  }
  const tekstur = teksturSesuai(opsi.umurBulan);
  if (!tekstur.includes(menu.tekstur)) {
    ditolak.push(`Tekstur "${menu.tekstur}" tidak sesuai umur ${Math.floor(opsi.umurBulan)} bulan (seharusnya ${tekstur.join(" atau ")}).`);
  }
  const hewani = opsi.daftarBahan.filter((b) => b.proteinHewani);
  const adaHewani = menu.bahan.some((b) => hewani.some((h) => sama(h.nama, b.nama)));
  if (opsi.perluProteinHewani && menu.waktu !== "selingan" && !adaHewani) {
    ditolak.push("Tidak ada protein hewani, padahal status gizi anak perlu perhatian.");
  }
  const tidakDikenal = menu.bahan.filter((b) => !opsi.daftarBahan.some((d) => sama(d.nama, b.nama)) && !/air|minyak|asi/i.test(b.nama));
  if (tidakDikenal.length) catatan.push(`Bahan di luar daftar: ${tidakDikenal.map((b) => b.nama).join(", ")}. Pastikan tersedia dan layak.`);
  if (opsi.budget !== undefined && menu.perkiraanBiaya > opsi.budget) {
    catatan.push(`Perkiraan biaya Rp${menu.perkiraanBiaya.toLocaleString("id-ID")} melebihi budget.`);
  }
  return { menu, ditolak, catatan };
}
