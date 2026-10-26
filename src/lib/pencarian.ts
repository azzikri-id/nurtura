/**
 * Kata kunci pencarian dibatasi ke huruf, angka, spasi, titik, apostrof, dan tanda hubung (maks. 60 karakter).
 * Nama orang tidak memuat karakter lain, dan ini mencegah pola serangan SQL ikut dikirim ke API database.
 */
export function bersihkanPencarian(mentah: string): string {
  return mentah.replace(/[^\p{L}\p{N} .'\u2019-]/gu, " ").replace(/-{2,}/g, "-").replace(/\s+/g, " ").trim().slice(0, 60);
}
