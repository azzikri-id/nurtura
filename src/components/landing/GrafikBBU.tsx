import type { ReactNode } from "react";
import { garisBBU, type JenisKelamin } from "@/lib/gizi";

type Titik = { bulan: number; kg: number };

const W = 360, H = 210, KIRI = 30, KANAN = 12, ATAS = 12, BAWAH = 26;

/**
 * Grafik berat badan menurut umur dengan garis referensi WHO asli
 * (median, −2 SD, −3 SD, dan pita −2 s.d. +2 SD).
 */
export function GrafikBBU({ jk, data, bulanMaks = 18, waspada = false }: {
  jk: JenisKelamin; data: Titik[]; bulanMaks?: number;
  /** Titik terakhir diberi warna waspada hanya bila anak punya peringatan aktif. */
  waspada?: boolean;
}) {
  const ref = (z: number) => garisBBU(jk, z, bulanMaks);
  const plus2 = ref(2), median = ref(0), min2 = ref(-2), min3 = ref(-3);
  const kgMin = Math.floor(Math.min(...min3.map((t) => t.kg)));
  const kgMaks = Math.ceil(Math.max(...plus2.map((t) => t.kg)));

  const x = (b: number) => KIRI + (b / bulanMaks) * (W - KIRI - KANAN);
  const y = (kg: number) => ATAS + (1 - (kg - kgMin) / (kgMaks - kgMin)) * (H - ATAS - BAWAH);
  const garis = (t: Titik[]) => t.map((p, i) => `${i ? "L" : "M"}${x(p.bulan).toFixed(1)} ${y(p.kg).toFixed(1)}`).join("");
  const pita = `${garis(plus2)}${[...min2].reverse().map((p) => `L${x(p.bulan).toFixed(1)} ${y(p.kg).toFixed(1)}`).join("")}Z`;
  const akhir = data[data.length - 1];
  const kgTicks = Array.from({ length: Math.floor((kgMaks - kgMin) / 2) + 1 }, (_, i) => kgMin + i * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label={`Grafik berat badan menurut umur: ${akhir.kg} kg pada umur ${akhir.bulan} bulan, dibandingkan kurva WHO`}>
      {kgTicks.map((kg) => (
        <g key={kg}>
          <line x1={KIRI} x2={W - KANAN} y1={y(kg)} y2={y(kg)} stroke="var(--color-garis)" strokeWidth="0.75" />
          <text x={KIRI - 6} y={y(kg) + 3} textAnchor="end" fontSize="10" fill="var(--color-redup)">{kg}</text>
        </g>
      ))}
      {Array.from({ length: Math.floor(bulanMaks / (bulanMaks <= 24 ? 6 : 12)) + 1 }, (_, i) => i * (bulanMaks <= 24 ? 6 : 12)).map((b) => (
        <text key={b} x={x(b)} y={H - 10} fontSize="10" fill="var(--color-redup)"
          textAnchor={b === 0 ? "start" : b === bulanMaks ? "end" : "middle"}>{b} bln</text>
      ))}
      <path d={pita} fill="var(--color-langit)" fillOpacity="0.08" />
      <path d={garis(median)} fill="none" stroke="var(--color-langit)" strokeOpacity="0.45" strokeWidth="1.25" />
      <path d={garis(min2)} fill="none" stroke="var(--color-waspada)" strokeDasharray="3 3" strokeWidth="1" />
      <path d={garis(min3)} fill="none" stroke="var(--color-bahaya)" strokeDasharray="3 3" strokeWidth="1" />
      <text x={W - KANAN} y={y(median[median.length - 1].kg) - 4} textAnchor="end" fontSize="9.5" fill="var(--color-redup)">median</text>
      <text x={W - KANAN} y={y(min2[min2.length - 1].kg) - 4} textAnchor="end" fontSize="9.5" fill="var(--color-waspada)">−2 SD</text>
      <text x={W - KANAN} y={y(min3[min3.length - 1].kg) + 11} textAnchor="end" fontSize="9.5" fill="var(--color-bahaya)">−3 SD</text>
      <path d={garis(data)} fill="none" stroke="var(--color-tinta)" strokeWidth="2" strokeLinejoin="round" />
      {data.map((p) => (
        <circle key={p.bulan} cx={x(p.bulan)} cy={y(p.kg)} r={p === akhir ? 4 : 2.2}
          fill={p === akhir && waspada ? "var(--color-waspada)" : "var(--color-tinta)"} stroke="white" strokeWidth={p === akhir ? 1.5 : 0} />
      ))}
    </svg>
  );
}

/** Contoh kecil tiap jenis garis agar legenda sama persis dengan yang digambar di grafik. */
function Contoh({ children }: { children: ReactNode }) {
  return <svg aria-hidden viewBox="0 0 18 8" className="h-2 w-[18px] shrink-0 overflow-visible">{children}</svg>;
}

/** Legenda grafik berat badan; selalu tampil di bawah grafik. */
export function LegendaGrafik({ nama, waspada = false }: { nama: string; waspada?: boolean }) {
  const butir: { ikon: ReactNode; label: string }[] = [
    { ikon: <><line x1="0" x2="18" y1="4" y2="4" stroke="var(--color-tinta)" strokeWidth="2" /><circle cx="9" cy="4" r="2.2" fill="var(--color-tinta)" /></>, label: nama },
    { ikon: <line x1="0" x2="18" y1="4" y2="4" stroke="var(--color-langit)" strokeOpacity="0.45" strokeWidth="1.5" />, label: "Rata-rata anak sehat (median)" },
    { ikon: <rect x="0" y="0" width="18" height="8" rx="1.5" fill="var(--color-langit)" fillOpacity="0.14" />, label: "Rentang normal (−2 s.d. +2 SD)" },
    { ikon: <line x1="0" x2="18" y1="4" y2="4" stroke="var(--color-waspada)" strokeDasharray="3 3" strokeWidth="1.5" />, label: "Batas berat kurang (−2 SD)" },
    { ikon: <line x1="0" x2="18" y1="4" y2="4" stroke="var(--color-bahaya)" strokeDasharray="3 3" strokeWidth="1.5" />, label: "Batas berat sangat kurang (−3 SD)" },
    { ikon: <circle cx="9" cy="4" r="3.5" fill={waspada ? "var(--color-waspada)" : "var(--color-tinta)"} stroke="white" strokeWidth="1.2" />,
      label: waspada ? "Penimbangan terakhir (ada peringatan)" : "Penimbangan terakhir" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 pb-3 pt-1 text-xs text-redup">
      {butir.map(({ ikon, label }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Contoh>{ikon}</Contoh>
          {label}
        </li>
      ))}
    </ul>
  );
}
