/**
 * Daftar bahan pangan lokal untuk menu MPASI. Harga = perkiraan kasar rupiah per 100 g di pasar
 * tradisional (2026), hanya untuk estimasi biaya; nilai gizi rinci sengaja tidak diisi.
 */
export type Bahan = { nama: string; proteinHewani: boolean; harga: number };

export const BAHAN: Bahan[] = [
  { nama: "Telur ayam", proteinHewani: true, harga: 3000 },
  { nama: "Hati ayam", proteinHewani: true, harga: 3500 },
  { nama: "Daging ayam", proteinHewani: true, harga: 4500 },
  { nama: "Daging sapi", proteinHewani: true, harga: 14000 },
  { nama: "Ikan lele", proteinHewani: true, harga: 3000 },
  { nama: "Ikan kembung", proteinHewani: true, harga: 4000 },
  { nama: "Ikan teri", proteinHewani: true, harga: 6000 },
  { nama: "Udang", proteinHewani: true, harga: 9000 },
  { nama: "Susu UHT tawar", proteinHewani: true, harga: 2000 },
  { nama: "Tempe", proteinHewani: false, harga: 1500 },
  { nama: "Tahu", proteinHewani: false, harga: 1500 },
  { nama: "Kacang hijau", proteinHewani: false, harga: 2500 },
  { nama: "Beras", proteinHewani: false, harga: 1500 },
  { nama: "Kentang", proteinHewani: false, harga: 2000 },
  { nama: "Ubi jalar", proteinHewani: false, harga: 1200 },
  { nama: "Jagung manis", proteinHewani: false, harga: 1500 },
  { nama: "Bayam", proteinHewani: false, harga: 1500 },
  { nama: "Kangkung", proteinHewani: false, harga: 1000 },
  { nama: "Wortel", proteinHewani: false, harga: 1500 },
  { nama: "Labu kuning", proteinHewani: false, harga: 1200 },
  { nama: "Brokoli", proteinHewani: false, harga: 4000 },
  { nama: "Tomat", proteinHewani: false, harga: 1500 },
  { nama: "Pisang", proteinHewani: false, harga: 1500 },
  { nama: "Pepaya", proteinHewani: false, harga: 1000 },
  { nama: "Alpukat", proteinHewani: false, harga: 3000 },
  { nama: "Minyak kelapa", proteinHewani: false, harga: 2000 },
  { nama: "Santan", proteinHewani: false, harga: 2000 },
  { nama: "Mentega tawar", proteinHewani: false, harga: 6000 },
  { nama: "Madu", proteinHewani: false, harga: 10000 },
];
