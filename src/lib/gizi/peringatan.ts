/**
 * Peringatan dini pertumbuhan (F6) dan deteksi kesalahan input (F7).
 * Modul murni: menerima riwayat pengukuran yang sudah dihitung z-score-nya.
 */
import type { Tingkat } from "./kategori";

export type Titik = {
  tglUkur: string;          // YYYY-MM-DD
  umurHari: number;
  beratKg: number;
  tinggiCm: number;         // sudah dikoreksi cara ukur
  zBBU: number | null;
  zTBU: number | null;
  zBBTB: number | null;
  tingkatBBU?: Tingkat;
  tingkatTBU?: Tingkat;
  tingkatBBTB?: Tingkat;
};

export type Peringatan = {
  jenis: "bb_tidak_naik_2x" | "z_turun" | "kategori_berisiko";
  tingkat: "bahaya" | "waspada" | "perhatian";
  pesan: string;
};

/**
 * Kenaikan Berat badan Minimal (KBM) per bulan untuk bayi 0–11 bulan, seperti pada KMS di Buku KIA,
 * dipakai untuk menentukan "Naik" (N) atau "Tidak naik" (T). Untuk umur ≥ 12 bulan pertambahan berat
 * normal sudah kecil (±150 g/bulan), jadi T hanya dipakai bila berat tetap atau turun — agar kader
 * tidak dibanjiri peringatan palsu. Ambang ini perlu dikonfirmasi dengan bidan/pedoman terbaru.
 */
export function kbmGram(umurBulan: number): number | null {
  const tabel = [800, 800, 900, 800, 600, 500, 400, 400, 300, 300, 300, 200]; // indeks = umur bulan (0–11)
  return umurBulan < tabel.length ? tabel[Math.max(0, Math.floor(umurBulan))] : null;
}

const HARI_PER_BULAN = 30.4375;
/** Dua pengukuran dianggap "bulan berurutan" bila berjarak 20–45 hari. */
const berurutan = (a: Titik, b: Titik) => {
  const selisih = b.umurHari - a.umurHari;
  return selisih >= 20 && selisih <= 45;
};

/** N (naik) / T (tidak naik) untuk pengukuran `b` dibanding bulan sebelumnya `a`. */
export function naikAtauTidak(a: Titik, b: Titik): "N" | "T" | null {
  if (!berurutan(a, b)) return null;
  const naikGram = Math.round((b.beratKg - a.beratKg) * 1000); // dibulatkan: 8,7 − 8,5 bukan 199,999… g
  const kbm = kbmGram(b.umurHari / HARI_PER_BULAN);
  return (kbm === null ? naikGram > 0 : naikGram >= kbm) ? "N" : "T";
}

/**
 * Peringatan untuk pengukuran terakhir dalam `riwayat` (urut dari yang paling lama).
 */
export function cekPeringatan(riwayat: Titik[]): Peringatan[] {
  const hasil: Peringatan[] = [];
  const n = riwayat.length;
  if (n === 0) return hasil;
  const akhir = riwayat[n - 1];

  // 1. Berat tidak naik (T) dua bulan berturut-turut ("2T").
  if (n >= 3) {
    const t1 = naikAtauTidak(riwayat[n - 3], riwayat[n - 2]);
    const t2 = naikAtauTidak(riwayat[n - 2], akhir);
    if (t1 === "T" && t2 === "T") {
      hasil.push({ jenis: "bb_tidak_naik_2x", tingkat: "waspada",
        pesan: "Berat badan tidak naik dua bulan berturut-turut." });
    }
  }

  // 2. Tren z-score turun > 0,5 SD dalam tiga pengukuran terakhir, walau masih normal.
  if (n >= 3) {
    const awal = riwayat[n - 3];
    for (const [nama, kunci] of [["TB/U", "zTBU"], ["BB/U", "zBBU"]] as const) {
      const za = awal[kunci], zb = akhir[kunci];
      if (za !== null && zb !== null && za - zb > 0.5) {
        hasil.push({ jenis: "z_turun", tingkat: "perhatian",
          pesan: `Z-score ${nama} turun ${(za - zb).toFixed(2).replace(".", ",")} SD dalam tiga pengukuran terakhir.` });
      }
    }
  }

  // 3. Masuk kategori berisiko (kurang/pendek atau lebih buruk, serta obesitas).
  const berisiko: string[] = [];
  let tingkat: Peringatan["tingkat"] = "waspada";
  for (const [nama, t] of [["PB/TB menurut umur", akhir.tingkatTBU], ["BB menurut PB/TB", akhir.tingkatBBTB], ["BB menurut umur", akhir.tingkatBBU]] as const) {
    if (t === "bahaya" || t === "waspada") berisiko.push(nama);
    if (t === "bahaya") tingkat = "bahaya";
  }
  if (berisiko.length) {
    hasil.push({ jenis: "kategori_berisiko", tingkat,
      pesan: `Status berisiko pada indikator ${berisiko.join(", ")}.` });
  }
  return hasil;
}

export type MasalahInput = { kolom: "beratKg" | "tinggiCm" | "umum"; pesan: string };

/**
 * Deteksi angka yang tidak masuk akal sebelum disimpan (F7). `sebelumnya` = pengukuran terakhir
 * yang tersimpan (boleh null untuk pengukuran pertama).
 * Batas z-score mengikuti flag data tidak wajar WHO: BB/U < −6 atau > 5, PB/U < −6 atau > 6,
 * BB/PB < −5 atau > 5.
 */
export function cekKewajaran(baru: Titik, sebelumnya: Titik | null): MasalahInput[] {
  const masalah: MasalahInput[] = [];
  if (sebelumnya) {
    if (baru.umurHari <= sebelumnya.umurHari) {
      masalah.push({ kolom: "umum", pesan: "Tanggal ukur sama atau lebih awal dari pengukuran sebelumnya." });
    }
    const perubahan = Math.abs(baru.beratKg - sebelumnya.beratKg) / sebelumnya.beratKg;
    if (perubahan > 0.3) {
      masalah.push({ kolom: "beratKg",
        pesan: `Berat berubah ${Math.round(perubahan * 100)}% dari pengukuran sebelumnya (${String(sebelumnya.beratKg).replace(".", ",")} kg).` });
    }
    if (sebelumnya.tinggiCm - baru.tinggiCm > 1) {
      masalah.push({ kolom: "tinggiCm",
        pesan: `Panjang/tinggi berkurang ${(sebelumnya.tinggiCm - baru.tinggiCm).toFixed(1).replace(".", ",")} cm dari pengukuran sebelumnya.` });
    }
  }
  if (baru.zBBU !== null && (baru.zBBU < -6 || baru.zBBU > 5))
    masalah.push({ kolom: "beratKg", pesan: "Berat badan sangat jauh dari standar umur. Periksa kembali angka atau satuannya." });
  if (baru.zTBU !== null && (baru.zTBU < -6 || baru.zTBU > 6))
    masalah.push({ kolom: "tinggiCm", pesan: "Panjang/tinggi sangat jauh dari standar umur. Periksa kembali angka atau satuannya." });
  if (baru.zBBTB !== null && (baru.zBBTB < -5 || baru.zBBTB > 5))
    masalah.push({ kolom: "umum", pesan: "Berat dan tinggi badan tidak sebanding. Periksa kembali kedua angka." });
  return masalah;
}
