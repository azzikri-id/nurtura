/**
 * Perhitungan z-score antropometri anak 0–60 bulan dengan metode LMS
 * WHO Child Growth Standards (2006), sesuai Permenkes No. 2 Tahun 2020.
 *
 * Modul ini murni (tanpa akses database/jaringan) agar mudah dites.
 */
import wfaData from "./data/wfa.json";
import lhfaData from "./data/lhfa.json";
import wflData from "./data/wfl.json";
import wfhData from "./data/wfh.json";

export type JenisKelamin = "L" | "P";
export type CaraUkur = "terlentang" | "berdiri";

type Lms = [number, number, number];
type Tabel = { start: number; step: number; "1": Lms[]; "2": Lms[] };

const WFA = wfaData as unknown as Tabel;
const LHFA = lhfaData as unknown as Tabel;
const WFL = wflData as unknown as Tabel;
const WFH = wfhData as unknown as Tabel;

/** Batas standar WHO: 0–1856 hari (60 bulan). */
export const UMUR_MAKS_HARI = 1856;
/** Mulai hari ke-731 (24 bulan) standar memakai tinggi badan, sebelumnya panjang badan. */
export const HARI_MULAI_TINGGI = 731;
const HARI_PER_BULAN = 30.4375;

const kodeJk = (jk: JenisKelamin) => (jk === "L" ? "1" : "2");

/** Umur dalam hari penuh antara tanggal lahir dan tanggal ukur (tanggal kalender, tanpa zona waktu). */
export function umurHari(tglLahir: string, tglUkur: string): number {
  const hari = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86_400_000;
  };
  return Math.floor(hari(tglUkur) - hari(tglLahir));
}

export const umurBulan = (hari: number) => hari / HARI_PER_BULAN;

/**
 * Koreksi cara ukur WHO: anak < 24 bulan seharusnya diukur terlentang (panjang),
 * anak ≥ 24 bulan berdiri (tinggi). Bila tidak sesuai, selisihnya 0,7 cm.
 */
export function koreksiPanjang(cm: number, hari: number, cara: CaraUkur): number {
  if (hari < HARI_MULAI_TINGGI && cara === "berdiri") return cm + 0.7;
  if (hari >= HARI_MULAI_TINGGI && cara === "terlentang") return cm - 0.7;
  return cm;
}

/** z-score LMS biasa. */
export function zLms(y: number, [L, M, S]: Lms): number {
  return L === 0 ? Math.log(y / M) / S : (Math.pow(y / M, L) - 1) / (L * S);
}

/** Nilai pengukuran pada z tertentu (kebalikan zLms). */
export function nilaiPadaZ(z: number, [L, M, S]: Lms): number {
  return L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);
}

/**
 * z-score terbatas untuk indikator berbasis berat (BB/U, BB/PB, BB/TB): di luar ±3 SD
 * WHO memakai jarak antara SD2 dan SD3 sebagai satuan, agar nilai ekstrem tidak membesar.
 */
export function zTerbatas(y: number, lms: Lms): number {
  const z = zLms(y, lms);
  if (z > 3) {
    const sd3 = nilaiPadaZ(3, lms);
    return 3 + (y - sd3) / (sd3 - nilaiPadaZ(2, lms));
  }
  if (z < -3) {
    const sd3 = nilaiPadaZ(-3, lms);
    return -3 + (y - sd3) / (nilaiPadaZ(-2, lms) - sd3);
  }
  return z;
}

function lmsUmur(tabel: Tabel, hari: number, jk: JenisKelamin): Lms | null {
  if (!Number.isInteger(hari) || hari < 0 || hari > UMUR_MAKS_HARI) return null;
  return tabel[kodeJk(jk)][hari] ?? null;
}

/** LMS untuk panjang/tinggi; nilai di antara kelipatan 0,1 cm diinterpolasi linear. */
function lmsPanjang(tabel: Tabel, cm: number, jk: JenisKelamin): Lms | null {
  const rows = tabel[kodeJk(jk)];
  const pos = (cm - tabel.start) / tabel.step;
  if (pos < -1e-9 || pos > rows.length - 1 + 1e-9) return null;
  const i = Math.min(Math.floor(pos + 1e-9), rows.length - 1);
  const f = pos - i;
  if (f < 1e-9 || i === rows.length - 1) return rows[i];
  const a = rows[i], b = rows[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** Berat badan menurut umur. */
export function zBBU(beratKg: number, hari: number, jk: JenisKelamin): number | null {
  const lms = lmsUmur(WFA, hari, jk);
  return lms ? zTerbatas(beratKg, lms) : null;
}

/** Panjang/tinggi badan menurut umur; `cm` harus sudah dikoreksi cara ukurnya. */
export function zTBU(cm: number, hari: number, jk: JenisKelamin): number | null {
  const lms = lmsUmur(LHFA, hari, jk);
  return lms ? zLms(cm, lms) : null;
}

/**
 * Berat badan menurut panjang badan (< 24 bulan, 45–110 cm) atau tinggi badan
 * (≥ 24 bulan, 65–120 cm); `cm` harus sudah dikoreksi cara ukurnya.
 */
export function zBBTB(beratKg: number, cm: number, hari: number, jk: JenisKelamin): number | null {
  if (hari < 0 || hari > UMUR_MAKS_HARI) return null;
  const lms = lmsPanjang(hari < HARI_MULAI_TINGGI ? WFL : WFH, cm, jk);
  return lms ? zTerbatas(beratKg, lms) : null;
}
