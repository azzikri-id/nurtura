import { kategoriBBTB, kategoriBBU, kategoriTBU, type Kategori, type Tingkat } from "@/lib/gizi/kategori";
import type { ReactNode } from "react";
import { formatZ } from "@/lib/format";

export type Indikator = "bbu" | "tbu" | "bbtb";

// Batas kategori Permenkes No. 2/2020 per indikator; label zona diambil dari fungsi kategori
// agar keterangan di skala selalu sama dengan label status yang tampil.
const BATAS: Record<Indikator, { batas: number[]; kategori: (z: number) => Kategori }> = {
  bbu: { batas: [-3, -2, 1], kategori: kategoriBBU },
  tbu: { batas: [-3, -2, 3], kategori: kategoriTBU },
  bbtb: { batas: [-3, -2, 1, 2, 3], kategori: kategoriBBTB },
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
const pos = (v: number) => ((Math.min(Math.max(v, MIN), MAKS) - MIN) / (MAKS - MIN)) * 100;
const angka = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

function rentang(dari: number | null, sampai: number | null) {
  if (dari === null) return `di bawah ${angka(sampai!)} SD`;
  if (sampai === null) return `di atas ${angka(dari)} SD`;
  return `${angka(dari)} s.d. ${angka(sampai)} SD`;
}

/** Keterangan kecil yang muncul saat zona disorot (kursor) atau diketuk/difokus (HP, keyboard). */
function Keterangan({ rata, children }: { rata: "kiri" | "tengah" | "kanan"; children: ReactNode }) {
  const posisi = { kiri: "left-0", tengah: "left-1/2 -translate-x-1/2", kanan: "right-0" }[rata];
  return (
    <span role="tooltip"
      className={`pointer-events-none invisible absolute bottom-full z-10 mb-1.5 whitespace-nowrap rounded-md bg-tinta px-2.5 py-1.5 text-xs leading-snug text-white opacity-0 shadow-sm transition-opacity group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100 ${posisi}`}>
      {children}
    </span>
  );
}

/**
 * Penggaris z-score −4 s.d. +4 SD: zona kategori sebagai garis tipis berwarna dan
 * penanda posisi anak, seperti membaca pita warna di KMS.
 */
export function SkalaZ({ indikator, z }: { indikator: Indikator; z: number }) {
  const { batas, kategori } = BATAS[indikator];
  const zona = [null, ...batas].map((dari, i) => {
    const sampai = batas[i] ?? null;
    const tengah = dari === null ? sampai! - 0.5 : sampai === null ? dari + 0.5 : (dari + sampai) / 2;
    return { dari, sampai, kat: kategori(tengah) };
  });
  const x = pos(z);

  return (
    <div className="relative h-3.5 w-full">
      {zona.map(({ dari, sampai, kat }, i) => {
        const kiri = pos(dari ?? MIN), kanan = pos(sampai ?? MAKS);
        const teks = `${kat.label}: ${rentang(dari, sampai)}`;
        return (
          <span key={i} tabIndex={0} role="img" aria-label={teks}
            className="group absolute -inset-y-1.5 cursor-default outline-none"
            style={{ left: `${kiri}%`, width: `${kanan - kiri}%` }}>
            <span className="absolute left-0 right-[0.6%] top-1/2 h-[2.5px] -translate-y-1/2 rounded-full opacity-55 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
              style={{ background: WARNA[kat.tingkat] }} />
            <Keterangan rata={i === 0 ? "kiri" : i === zona.length - 1 ? "kanan" : "tengah"}>
              <b className="font-semibold">{kat.label}</b> · {rentang(dari, sampai)}
            </Keterangan>
          </span>
        );
      })}
      {[-2, 0, 2].map((t) => (
        <span key={t} aria-hidden className="pointer-events-none absolute top-1 h-1.5 w-px bg-redup/50" style={{ left: `${pos(t)}%` }} />
      ))}
      <span tabIndex={0} role="img" aria-label={`Posisi anak: z ${formatZ(z)}`}
        className="group absolute -inset-y-1 w-3 -translate-x-1/2 cursor-default outline-none" style={{ left: `${x}%` }}>
        <span className="absolute inset-y-1 left-1/2 w-[2.5px] -translate-x-1/2 rounded-full bg-tinta" />
        <Keterangan rata={x < 20 ? "kiri" : x > 80 ? "kanan" : "tengah"}>Posisi anak · z {formatZ(z)}</Keterangan>
      </span>
    </div>
  );
}
