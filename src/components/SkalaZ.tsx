import type { Tingkat } from "@/lib/gizi/kategori";

export type Indikator = "bbu" | "tbu" | "bbtb";

// Zona kategori Permenkes No. 2/2020 per indikator, dari kiri (−∞) ke kanan (+∞).
const ZONA: Record<Indikator, { sampai: number; tingkat: Tingkat }[]> = {
  bbu: [{ sampai: -3, tingkat: "bahaya" }, { sampai: -2, tingkat: "waspada" }, { sampai: 1, tingkat: "normal" }, { sampai: Infinity, tingkat: "perhatian" }],
  tbu: [{ sampai: -3, tingkat: "bahaya" }, { sampai: -2, tingkat: "waspada" }, { sampai: 3, tingkat: "normal" }, { sampai: Infinity, tingkat: "perhatian" }],
  bbtb: [{ sampai: -3, tingkat: "bahaya" }, { sampai: -2, tingkat: "waspada" }, { sampai: 1, tingkat: "normal" }, { sampai: 3, tingkat: "perhatian" }, { sampai: Infinity, tingkat: "bahaya" }],
};

const WARNA: Record<Tingkat, string> = {
  bahaya: "var(--color-bahaya)",
  waspada: "var(--color-waspada)",
  normal: "var(--color-normal)",
  perhatian: "var(--color-perhatian)",
};

export const warnaTeks: Record<Tingkat, string> = {
  bahaya: "text-bahaya",
  waspada: "text-waspada",
  normal: "text-normal",
  perhatian: "text-perhatian",
};

const MIN = -4, MAKS = 4;

/**
 * Penggaris z-score −4 s.d. +4 SD: zona kategori sebagai garis tipis berwarna dan
 * penanda posisi anak, seperti membaca pita warna di KMS.
 */
export function SkalaZ({ indikator, z }: { indikator: Indikator; z: number }) {
  const pos = (v: number) => ((Math.min(Math.max(v, MIN), MAKS) - MIN) / (MAKS - MIN)) * 100;
  const zona = ZONA[indikator];
  const segmen = zona.map((z, i) => ({
    dari: pos(i === 0 ? MIN : zona[i - 1].sampai),
    ke: pos(z.sampai),
    tingkat: z.tingkat,
  }));
  const x = pos(z);

  return (
    <svg viewBox="0 0 100 14" preserveAspectRatio="none" className="h-3.5 w-full overflow-visible" aria-hidden>
      {segmen.map((s, i) => (
        <rect key={i} x={s.dari} y={5.75} width={Math.max(s.ke - s.dari - 0.6, 0)} height={2.5}
          fill={WARNA[s.tingkat]} fillOpacity={0.55} />
      ))}
      {[-2, 0, 2].map((t) => (
        <line key={t} x1={pos(t)} x2={pos(t)} y1={4} y2={10} stroke="var(--color-redup)" strokeOpacity={0.5}
          strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
      ))}
      <line x1={x} x2={x} y1={0} y2={14} stroke="var(--color-tinta)" strokeWidth={2.5}
        strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
