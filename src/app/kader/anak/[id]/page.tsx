import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Memuat } from "@/components/app/Memuat";
import { wajibPeran } from "@/lib/auth";
import { detailAnak } from "@/lib/data/kader";
import { umurHari } from "@/lib/gizi";
import { formatAngka, formatTanggal, formatUmur, formatZ, hariIniWIB } from "@/lib/format";
import { SkalaZ, warnaTeks, type Indikator } from "@/components/SkalaZ";
import { GrafikBBU } from "@/components/landing/GrafikBBU";
import { FormPengukuran } from "./FormPengukuran";

export const metadata: Metadata = { title: "Detail anak" };

const JENIS_PERINGATAN: Record<string, string> = {
  bb_tidak_naik_2x: "Berat tidak naik 2 bulan",
  z_turun: "Pertumbuhan melambat",
  kategori_berisiko: "Status gizi berisiko",
};

export default function DetailAnakKader({ params }: PageProps<"/kader/anak/[id]">) {
  return (
    <Suspense fallback={<Memuat />}>
      <IsiDetail params={params} />
    </Suspense>
  );
}

async function IsiDetail({ params }: Pick<PageProps<"/kader/anak/[id]">, "params">) {
  await wajibPeran("kader");
  const { id } = await params;
  const anak = await detailAnak(id);
  if (!anak) notFound();

  const hariIni = hariIniWIB();
  const umurSekarang = umurHari(anak.tglLahir, hariIni);
  const t = anak.terakhir;
  const indikator: { kode: Indikator; nama: string; s: NonNullable<typeof t>["bbu"] }[] = t ? [
    { kode: "bbu", nama: "Berat badan menurut umur", s: t.bbu },
    { kode: "tbu", nama: t.umurHari < 731 ? "Panjang badan menurut umur" : "Tinggi badan menurut umur", s: t.tbu },
    { kode: "bbtb", nama: t.umurHari < 731 ? "Berat menurut panjang badan" : "Berat menurut tinggi badan", s: t.bbtb },
  ] : [];
  const titikGrafik = anak.riwayat.map((u) => ({ bulan: u.umurHari / 30.4375, kg: u.beratKg }));
  const bulanMaks = Math.min(60, Math.max(12, Math.ceil((umurSekarang / 30.4375 + 2) / 6) * 6));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link href="/kader" className="text-sm font-semibold text-langit-tua hover:underline">← Daftar anak</Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">{anak.nama}</h1>
          <p className="mt-1 text-sm text-redup">
            {anak.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"} · {formatUmur(umurSekarang)} (lahir {formatTanggal(anak.tglLahir)}) ·
            Ibu {anak.namaIbu}{anak.namaAyah ? `, Ayah ${anak.namaAyah}` : ""} · {anak.posyanduNama}
          </p>
        </div>
        <p className="text-sm text-redup">
          Kode undangan orang tua <span className="font-mono font-bold tracking-wider text-tinta">{anak.kodeUndangan}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-garis bg-white">
            <h2 className="border-b border-garis px-5 py-3 text-sm font-bold text-tinta">
              Status gizi {t ? `· ${formatTanggal(t.tglUkur)}` : ""}
            </h2>
            {!t ? (
              <p className="px-5 py-6 text-sm text-redup">Belum ada pengukuran.</p>
            ) : (
              <dl className="divide-y divide-garis px-5">
                {indikator.map(({ kode, nama, s }) => (
                  <div key={kode} className="grid grid-cols-[1fr_4rem] items-center gap-3 py-3">
                    <dt>
                      <p className="text-xs text-redup">{nama}</p>
                      {s && <p className={`font-semibold ${warnaTeks[s.tingkat]}`}>{s.label}</p>}
                      {s && <SkalaZ indikator={kode} z={s.z} />}
                    </dt>
                    <dd className="text-right font-bold tabular-nums text-tinta">{s ? formatZ(s.z) : "—"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {anak.peringatanAktif.length > 0 && (
            <section className="rounded-xl border border-waspada/40 bg-waspada-latar px-5 py-4">
              <h2 className="text-sm font-bold text-waspada">Peringatan</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {anak.peringatanAktif.map((p) => (
                  <li key={p.id}>
                    <p className={`font-semibold ${warnaTeks[p.tingkat]}`}>
                      {JENIS_PERINGATAN[p.jenis] ?? p.jenis}
                      <span className="font-normal text-redup"> · {p.status === "baru" ? "menunggu bidan" : "sedang ditindaklanjuti"}</span>
                    </p>
                    {p.catatan && <p className="text-tinta/80">{p.catatan}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-garis bg-white px-4 pt-4">
            <h2 className="px-1 text-sm font-bold text-tinta">Berat badan menurut umur (kg)</h2>
            {titikGrafik.length ? (
              <GrafikBBU jk={anak.jenisKelamin} data={titikGrafik} bulanMaks={bulanMaks} />
            ) : (
              <p className="px-1 pb-6 pt-2 text-sm text-redup">Grafik muncul setelah pengukuran pertama.</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-garis bg-white p-5">
            <h2 className="text-lg font-bold text-tinta">Catat penimbangan</h2>
            <p className="mb-4 text-sm text-redup">Status gizi dan peringatan dihitung otomatis setelah disimpan.</p>
            <FormPengukuran anakId={anak.id} hariIni={hariIni} caraBawaan={umurSekarang < 731 ? "terlentang" : "berdiri"} />
          </section>

          <section className="overflow-hidden rounded-xl border border-garis bg-white">
            <h2 className="border-b border-garis px-5 py-3 text-sm font-bold text-tinta">Riwayat penimbangan</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-redup">
                  <tr className="border-b border-garis">
                    <th scope="col" className="px-5 py-2 font-medium">Tanggal</th>
                    <th scope="col" className="px-3 py-2 font-medium">BB (kg)</th>
                    <th scope="col" className="px-3 py-2 font-medium">PB/TB (cm)</th>
                    <th scope="col" className="px-3 py-2 font-medium">TB/U</th>
                    <th scope="col" className="px-5 py-2 font-medium">BB/TB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-garis tabular-nums">
                  {[...anak.riwayat].reverse().map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-2 text-tinta">{formatTanggal(u.tglUkur)}</td>
                      <td className="px-3 py-2 text-tinta">{formatAngka(u.beratKg)}</td>
                      <td className="px-3 py-2 text-tinta">{formatAngka(u.tinggiCm)}</td>
                      <td className={`px-3 py-2 font-semibold ${u.tbu ? warnaTeks[u.tbu.tingkat] : ""}`}>{u.tbu ? formatZ(u.tbu.z) : "—"}</td>
                      <td className={`px-5 py-2 font-semibold ${u.bbtb ? warnaTeks[u.bbtb.tingkat] : ""}`}>{u.bbtb ? formatZ(u.bbtb.z) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
