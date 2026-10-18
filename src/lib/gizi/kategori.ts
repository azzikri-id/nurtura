/**
 * Kategori status gizi anak 0–60 bulan menurut Permenkes No. 2 Tahun 2020
 * tentang Standar Antropometri Anak, beserta penjelasan berbahasa awam untuk orang tua.
 */

export type Tingkat = "bahaya" | "waspada" | "normal" | "perhatian";

export type Kategori = { label: string; tingkat: Tingkat; penjelasan: string };

const KE_BIDAN = "Konsultasikan dengan bidan atau puskesmas terdekat.";

/** BB/U — berat badan menurut umur. */
export function kategoriBBU(z: number): Kategori {
  if (z < -3)
    return { label: "Berat badan sangat kurang", tingkat: "bahaya",
      penjelasan: `Berat badan anak jauh di bawah anak seusianya. ${KE_BIDAN}` };
  if (z < -2)
    return { label: "Berat badan kurang", tingkat: "waspada",
      penjelasan: `Berat badan anak di bawah anak seusianya. Perhatikan asupan makan dan ${KE_BIDAN.toLowerCase()}` };
  if (z <= 1)
    return { label: "Berat badan normal", tingkat: "normal",
      penjelasan: "Berat badan anak sesuai dengan anak seusianya. Tetap timbang setiap bulan." };
  return { label: "Risiko berat badan lebih", tingkat: "perhatian",
    penjelasan: "Berat badan anak di atas anak seusianya. Lihat juga BB/TB untuk memastikan." };
}

/** PB/U atau TB/U — panjang/tinggi badan menurut umur (indikator stunting). */
export function kategoriTBU(z: number): Kategori {
  if (z < -3)
    return { label: "Sangat pendek", tingkat: "bahaya",
      penjelasan: `Tinggi badan anak jauh di bawah standar seusianya, tanda stunting berat. ${KE_BIDAN}` };
  if (z < -2)
    return { label: "Pendek", tingkat: "waspada",
      penjelasan: `Tinggi badan anak di bawah standar seusianya, tanda risiko stunting. ${KE_BIDAN}` };
  if (z <= 3)
    return { label: "Normal", tingkat: "normal",
      penjelasan: "Tinggi badan anak sesuai standar seusianya." };
  return { label: "Tinggi", tingkat: "perhatian",
    penjelasan: "Tinggi badan anak di atas standar seusianya. Umumnya tidak perlu dikhawatirkan." };
}

/** BB/PB atau BB/TB — berat badan menurut panjang/tinggi badan. */
export function kategoriBBTB(z: number): Kategori {
  if (z < -3)
    return { label: "Gizi buruk", tingkat: "bahaya",
      penjelasan: `Anak sangat kurus untuk tinggi badannya dan perlu penanganan segera. ${KE_BIDAN}` };
  if (z < -2)
    return { label: "Gizi kurang", tingkat: "waspada",
      penjelasan: `Anak kurus untuk tinggi badannya. ${KE_BIDAN}` };
  if (z <= 1)
    return { label: "Gizi baik (normal)", tingkat: "normal",
      penjelasan: "Berat badan anak seimbang dengan tinggi badannya." };
  if (z <= 2)
    return { label: "Berisiko gizi lebih", tingkat: "perhatian",
      penjelasan: "Berat badan anak mulai berlebih untuk tinggi badannya. Perhatikan pola makan." };
  if (z <= 3)
    return { label: "Gizi lebih", tingkat: "perhatian",
      penjelasan: `Berat badan anak berlebih untuk tinggi badannya. ${KE_BIDAN}` };
  return { label: "Obesitas", tingkat: "bahaya",
    penjelasan: `Berat badan anak jauh berlebih untuk tinggi badannya. ${KE_BIDAN}` };
}
