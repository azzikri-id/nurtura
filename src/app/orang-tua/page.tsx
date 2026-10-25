import type { Metadata } from "next";
import { Suspense } from "react";
import { Memuat } from "@/components/app/Memuat";
import { SkalaZ, warnaTeks, type Indikator } from "@/components/SkalaZ";
import { GrafikBBU, LegendaGrafik } from "@/components/landing/GrafikBBU";
import { wajibPeran } from "@/lib/auth";
import { daftarAnak, detailAnak, type DetailAnak } from "@/lib/data/kader";
import { kategoriBBTB, kategoriBBU, kategoriTBU, umurHari } from "@/lib/gizi";
import { formatAngka, formatTanggal, formatUmur, hariIniWIB } from "@/lib/format";
import { FormKlaim } from "./FormKlaim";
import { AsistenGizi } from "@/components/orang-tua/AsistenGizi";
import { MenuMpasi } from "@/components/orang-tua/MenuMpasi";
import { DataPrivasi } from "@/components/orang-tua/DataPrivasi";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Anak saya" };

const PENJELASAN = { bbu: kategoriBBU, tbu: kategoriTBU, bbtb: kategoriBBTB };

const PERINGATAN: Record<string, string> = {
  bb_tidak_naik_2x: "Berat badan anak tidak naik dua bulan terakhir. Kader dan bidan sudah diberi tahu dan akan menghubungi Anda.",
  z_turun: "Pertumbuhan anak melambat dibanding bulan-bulan sebelumnya.",
  kategori_berisiko: "Ada indikator yang perlu perhatian. Bidan wilayah sudah diberi tahu.",
};

export default function BerandaOrangTua() {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi />
    </Suspense>
  );
}

async function Isi() {
  await wajibPeran("orang_tua");
  const daftar = await daftarAnak();
  const anak = (await Promise.all(daftar.map((a) => detailAnak(a.id)))).filter((a): a is DetailAnak => !!a);
  const supabase = await createClient();
  const { data: bahanPangan } = await supabase.from("bahan_pangan").select("nama, protein_hewani").order("nama");
  const bahan = (bahanPangan ?? []).map((b) => ({ nama: b.nama, proteinHewani: b.protein_hewani }));

  if (!anak.length) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Tautkan data anak Anda</h1>
        <p className="mt-2 text-redup">
          Masukkan kode undangan 8 karakter yang diberikan kader posyandu saat anak didaftarkan.
        </p>
        <FormKlaim />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-8">
      {anak.map((a) => <KartuAnak key={a.id} anak={a} bahan={bahan} />)}
    </div>
  );
}

function KartuAnak({ anak, bahan }: { anak: DetailAnak; bahan: { nama: string; proteinHewani: boolean }[] }) {
  const hariIni = hariIniWIB();
  const umur = umurHari(anak.tglLahir, hariIni);
  const t = anak.terakhir;
  const panggilan = anak.nama.split(" ")[0];
  const indikator: { kode: Indikator; judul: string }[] = [
    { kode: "tbu", judul: "Tinggi badan" },
    { kode: "bbtb", judul: "Berat untuk tingginya" },
    { kode: "bbu", judul: "Berat untuk umurnya" },
  ];

  return (
    <article>
      <h1 className="text-2xl font-extrabold tracking-tight text-tinta">{anak.nama}</h1>
      <p className="mt-1 text-sm text-redup">
        {formatUmur(umur)} · {anak.posyanduNama}
        {t && <> · terakhir ditimbang {formatTanggal(t.tglUkur)}: {formatAngka(t.beratKg)} kg, {formatAngka(t.tinggiCm)} cm</>}
      </p>

      {anak.peringatanAktif.length > 0 && (
        <div className="mt-5 rounded-xl border border-waspada/40 bg-waspada-latar px-5 py-4 text-sm text-tinta">
          {[...new Set(anak.peringatanAktif.map((p) => p.jenis))].map((j) => <p key={j}>{PERINGATAN[j] ?? j}</p>)}
        </div>
      )}

      {t && (
        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          {indikator.map(({ kode, judul }) => {
            const s = t[kode];
            if (!s) return null;
            const kat = PENJELASAN[kode](s.z);
            return (
              <div key={kode} className="rounded-xl border border-garis bg-white p-4">
                <p className="text-xs text-redup">{judul}</p>
                <p className={`mt-0.5 font-bold ${warnaTeks[kat.tingkat]}`}>{kat.label}</p>
                <div className="mt-1"><SkalaZ indikator={kode} z={s.z} /></div>
                <p className="mt-2 text-sm text-redup">{kat.penjelasan}</p>
              </div>
            );
          })}
        </section>
      )}

      {anak.riwayat.length > 0 && (
        <section className="mt-5 rounded-xl border border-garis bg-white px-4 pt-4">
          <h2 className="px-1 text-sm font-bold text-tinta">Grafik berat badan</h2>
          <div className="max-w-2xl">
            <GrafikBBU jk={anak.jenisKelamin} data={anak.riwayat.map((u) => ({ bulan: u.umurHari / 30.4375, kg: u.beratKg }))}
              bulanMaks={Math.min(60, Math.max(12, Math.ceil((umur / 30.4375 + 2) / 6) * 6))} waspada={anak.peringatanAktif.length > 0} />
            <LegendaGrafik nama={panggilan} waspada={anak.peringatanAktif.length > 0} />
          </div>
          <details className="group border-t border-garis px-1 py-3 text-sm">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 font-semibold text-langit-tua [&::-webkit-details-marker]:hidden">
              <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 transition-transform group-open:rotate-90">
                <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cara membaca grafik
            </summary>
            <div className="mt-2 max-w-2xl space-y-2 leading-relaxed text-tinta/85">
              <p>
                Setiap titik adalah hasil penimbangan {panggilan} di posyandu. Anak yang tumbuh baik punya garis yang terus
                naik, kurang lebih sejajar dengan garis rata-rata anak sehat.
              </p>
              <p>
                <b>SD</b> (standar deviasi) menunjukkan seberapa jauh berat {panggilan} dari rata-rata anak sehat seusianya
                menurut WHO. Selama garisnya berada di dalam pita biru, di atas garis −2 SD, beratnya masih normal.
              </p>
              <p>
                Waspadai bila garis <b>mendatar atau turun</b>, atau makin dekat ke garis putus-putus cokelat. Artinya berat
                anak tidak naik sebagaimana mestinya, walaupun statusnya mungkin masih normal.
              </p>
              <p>
                Bila itu terjadi, kader dan bidan diberi tahu secara otomatis. Anda juga bisa bertanya saat posyandu atau
                lewat asisten gizi di bawah.
              </p>
            </div>
          </details>
        </section>
      )}

      <div className="mt-5 space-y-5">
        <AsistenGizi anakId={anak.id} namaPanggilan={anak.nama.split(" ")[0]} />
        <MenuMpasi anakId={anak.id} bahan={bahan} />
        <DataPrivasi anakId={anak.id} namaAnak={anak.nama} />
      </div>
    </article>
  );
}
