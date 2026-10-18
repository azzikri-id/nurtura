import type { InputPengukuran } from "@/lib/gizi";

/** Pengukuran anak contoh (fiktif) yang dipakai kartu hero dan kalkulator di halaman depan. */
export const CONTOH_PENGUKURAN: InputPengukuran = {
  tglLahir: "2025-08-18",
  tglUkur: "2026-10-18",
  jenisKelamin: "L",
  beratKg: 8.5,
  tinggiCm: 72,
  caraUkur: "terlentang",
};

// Berat badan bulanan sejak lahir. Tiga bulan terakhir tidak naik,
// pola yang ingin ditangkap Nurtura lebih awal.
export const CONTOH_BERAT_BULANAN = [3.2, 4.3, 5.4, 6.2, 6.8, 7.2, 7.5, 7.8, 8.0, 8.2, 8.3, 8.4, 8.5, 8.5, 8.5];
