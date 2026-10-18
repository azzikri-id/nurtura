import {
  type CaraUkur,
  type JenisKelamin,
  UMUR_MAKS_HARI,
  koreksiPanjang,
  umurBulan,
  umurHari,
  zBBTB,
  zBBU,
  zTBU,
} from "./zscore";
import { type Kategori, kategoriBBTB, kategoriBBU, kategoriTBU } from "./kategori";

export * from "./zscore";
export * from "./kategori";

export type InputPengukuran = {
  tglLahir: string; // YYYY-MM-DD
  tglUkur: string; // YYYY-MM-DD
  jenisKelamin: JenisKelamin;
  beratKg: number;
  tinggiCm: number;
  caraUkur: CaraUkur;
};

type Hasil = { z: number; kategori: Kategori } | null;

export type StatusGizi = {
  umurHari: number;
  umurBulan: number;
  tinggiTerkoreksiCm: number;
  bbu: Hasil;
  tbu: Hasil;
  bbtb: Hasil;
};

const bulat = (n: number) => Math.round(n * 100) / 100;

/**
 * Hitung status gizi lengkap dari satu pengukuran. Indikator yang di luar
 * cakupan standar WHO (mis. panjang badan < 45 cm) bernilai null.
 */
export function hitungStatusGizi(input: InputPengukuran): StatusGizi {
  const hari = umurHari(input.tglLahir, input.tglUkur);
  if (hari < 0 || hari > UMUR_MAKS_HARI) {
    throw new RangeError("Umur anak harus 0–60 bulan pada tanggal ukur.");
  }
  const cm = koreksiPanjang(input.tinggiCm, hari, input.caraUkur);
  // Kategori ditentukan dari z yang sudah dibulatkan agar angka dan label yang tampil selalu konsisten.
  const hasil = (z: number | null, kat: (z: number) => Kategori): Hasil =>
    z === null ? null : { z: bulat(z), kategori: kat(bulat(z)) };

  return {
    umurHari: hari,
    umurBulan: bulat(umurBulan(hari)),
    tinggiTerkoreksiCm: bulat(cm),
    bbu: hasil(zBBU(input.beratKg, hari, input.jenisKelamin), kategoriBBU),
    tbu: hasil(zTBU(cm, hari, input.jenisKelamin), kategoriTBU),
    bbtb: hasil(zBBTB(input.beratKg, cm, hari, input.jenisKelamin), kategoriBBTB),
  };
}
