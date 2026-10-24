/**
 * Penyaring sebelum teks dikirim ke model AI: identitas dihapus, dan pertanyaan bertanda bahaya
 * dialihkan ke fasilitas kesehatan tanpa memanggil model sama sekali.
 */

/** Hapus data identitas dari teks bebas. `nama` = nama anak/orang tua yang diketahui sistem. */
export function redaksi(teks: string, nama: string[] = []): string {
  let hasil = teks
    .replace(/\b\d{16}\b/g, "[NIK]")                                  // NIK
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")                 // email
    .replace(/(\+62|62|0)8[\d\s-]{7,13}\d/g, "[nomor HP]");            // nomor HP Indonesia
  for (const n of nama) {
    for (const kata of n.split(/\s+/).filter((k) => k.length >= 3)) {
      hasil = hasil.replace(new RegExp(`\\b${kata.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), "[nama]");
    }
  }
  return hasil;
}

// Tanda bahaya pada balita yang harus segera dibawa ke fasilitas kesehatan (mengacu MTBS/Buku KIA).
const TANDA_BAHAYA: [RegExp, string][] = [
  [/kejang|step\b/i, "kejang"],
  [/sesak|napas (cepat|berat|tersengal)|nafas (cepat|berat)|tarikan dinding dada/i, "sesak napas"],
  [/tidak (mau|bisa) (minum|menyusu|makan sama sekali)|tidak mau menyusu/i, "tidak bisa minum atau menyusu"],
  [/muntah (terus|setiap|semua)|muntah-muntah/i, "muntah terus-menerus"],
  [/(diare|mencret|bab) (ber)?darah|tinja berdarah|berak darah/i, "diare berdarah"],
  [/lemas sekali|tidak sadar|pingsan|sulit dibangunkan|tidak responsif/i, "lemas atau tidak sadar"],
  [/demam (tinggi|sangat|lebih dari|>)\s*|(39|40|41)[,.]?\d?\s*°?\s*c?\b|panas tinggi/i, "demam tinggi"],
  [/bibir (biru|kebiruan)|kulit (biru|kebiruan)/i, "kebiruan"],
  [/mata cekung|tidak (kencing|pipis)|ubun-ubun cekung/i, "tanda kekurangan cairan"],
];

/** Daftar tanda bahaya yang disebut dalam pertanyaan (kosong bila tidak ada). */
export function tandaBahaya(teks: string): string[] {
  return [...new Set(TANDA_BAHAYA.filter(([re]) => re.test(teks)).map(([, nama]) => nama))];
}

export const PESAN_BAHAYA = (tanda: string[]) =>
  `Pertanyaan Anda menyebut tanda bahaya (${tanda.join(", ")}). Jangan menunggu: segera bawa anak ke puskesmas, ` +
  `klinik, atau IGD terdekat, dan hubungi bidan desa Anda. Asisten gizi tidak memberi saran untuk kondisi ini.`;
