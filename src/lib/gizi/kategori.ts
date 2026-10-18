/**
 * Kategori status gizi anak 0–60 bulan menurut Permenkes No. 2 Tahun 2020
 * tentang Standar Antropometri Anak.
 */

export type Tingkat = "bahaya" | "waspada" | "normal" | "perhatian";

export type Kategori = { label: string; tingkat: Tingkat };

/** BB/U — berat badan menurut umur. */
export function kategoriBBU(z: number): Kategori {
  if (z < -3) return { label: "Berat badan sangat kurang", tingkat: "bahaya" };
  if (z < -2) return { label: "Berat badan kurang", tingkat: "waspada" };
  if (z <= 1) return { label: "Berat badan normal", tingkat: "normal" };
  return { label: "Risiko berat badan lebih", tingkat: "perhatian" };
}

/** PB/U atau TB/U — panjang/tinggi badan menurut umur (indikator stunting). */
export function kategoriTBU(z: number): Kategori {
  if (z < -3) return { label: "Sangat pendek", tingkat: "bahaya" };
  if (z < -2) return { label: "Pendek", tingkat: "waspada" };
  if (z <= 3) return { label: "Normal", tingkat: "normal" };
  return { label: "Tinggi", tingkat: "perhatian" };
}

/** BB/PB atau BB/TB — berat badan menurut panjang/tinggi badan. */
export function kategoriBBTB(z: number): Kategori {
  if (z < -3) return { label: "Gizi buruk", tingkat: "bahaya" };
  if (z < -2) return { label: "Gizi kurang", tingkat: "waspada" };
  if (z <= 1) return { label: "Gizi baik (normal)", tingkat: "normal" };
  if (z <= 2) return { label: "Berisiko gizi lebih", tingkat: "perhatian" };
  if (z <= 3) return { label: "Gizi lebih", tingkat: "perhatian" };
  return { label: "Obesitas", tingkat: "bahaya" };
}
