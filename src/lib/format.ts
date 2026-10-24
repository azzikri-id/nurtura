const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-10-18" → "18 Okt 2026" (tanpa zona waktu, aman di server & browser). */
export function formatTanggal(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

/** Umur dari jumlah hari: "14 bulan" atau "2 tahun 3 bulan". */
export function formatUmur(hari: number): string {
  const bulan = Math.floor(hari / 30.4375);
  if (bulan < 24) return `${bulan} bulan`;
  const sisa = bulan % 12;
  return `${Math.floor(bulan / 12)} tahun${sisa ? ` ${sisa} bulan` : ""}`;
}

/** −2,44 dengan tanda minus tipografis dan koma desimal. */
export const formatZ = (z: number) => z.toFixed(2).replace(".", ",").replace("-", "−");

export const formatAngka = (n: number) => String(n).replace(".", ",");

/** Tanggal hari ini menurut WIB, untuk nilai default form. */
export function hariIniWIB(): string {
  return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
}
