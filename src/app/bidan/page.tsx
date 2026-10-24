import type { Metadata } from "next";
import { Suspense } from "react";
import { Memuat } from "@/components/app/Memuat";
import { warnaTeks } from "@/components/SkalaZ";
import { wajibPeran } from "@/lib/auth";
import { daftarAnak, type AnakRingkas } from "@/lib/data/kader";
import { umurHari } from "@/lib/gizi";
import { formatTanggal, formatUmur, formatZ, hariIniWIB } from "@/lib/format";
import { FormTindak } from "./FormTindak";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dasbor puskesmas" };

const JENIS: Record<string, string> = {
  bb_tidak_naik_2x: "Berat tidak naik 2 bulan",
  z_turun: "Pertumbuhan melambat",
  kategori_berisiko: "Status gizi berisiko",
};

const berisiko = (t: "bahaya" | "waspada" | "normal" | "perhatian" | undefined) => t === "bahaya" || t === "waspada";
const persen = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}%` : "—");

export default function BerandaBidan() {
  return (
    <Suspense fallback={<Memuat />}>
      <Dasbor />
    </Suspense>
  );
}

async function Dasbor() {
  await wajibPeran("bidan");
  const anak = await daftarAnak();
  const hariIni = hariIniWIB();

  const perPosyandu = new Map<string, AnakRingkas[]>();
  for (const a of anak) perPosyandu.set(a.posyanduNama, [...(perPosyandu.get(a.posyanduNama) ?? []), a]);
  const rekap = [...perPosyandu.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([nama, daftar]) => ({
    nama,
    total: daftar.length,
    pendek: daftar.filter((a) => berisiko(a.terakhir?.tbu?.tingkat)).length,
    kurus: daftar.filter((a) => berisiko(a.terakhir?.bbtb?.tingkat)).length,
    peringatan: daftar.filter((a) => a.peringatanAktif.length).length,
  }));
  const total = rekap.reduce((s, r) => ({ total: s.total + r.total, pendek: s.pendek + r.pendek, kurus: s.kurus + r.kurus, peringatan: s.peringatan + r.peringatan }),
    { total: 0, pendek: 0, kurus: 0, peringatan: 0 });

  // Tren 6 bulan terakhir dari semua pengukuran di wilayah (RLS membatasi ke posyandu binaan).
  const supabase = await createClient();
  const awal = new Date(Date.parse(`${hariIni.slice(0, 7)}-01`) - 150 * 86_400_000).toISOString().slice(0, 7);
  const { data: semuaUkur } = await supabase
    .from("pengukuran")
    .select("tgl_ukur, anak_id, status_gizi(z_tbu, z_bbtb)")
    .gte("tgl_ukur", `${awal}-01`);
  const perBulan = new Map<string, { anak: Set<string>; pendek: number; kurus: number; total: number }>();
  for (const u of semuaUkur ?? []) {
    const bulan = u.tgl_ukur.slice(0, 7);
    const s = Array.isArray(u.status_gizi) ? u.status_gizi[0] : u.status_gizi;
    const b = perBulan.get(bulan) ?? { anak: new Set<string>(), pendek: 0, kurus: 0, total: 0 };
    b.anak.add(u.anak_id);
    b.total++;
    if (s?.z_tbu != null && Number(s.z_tbu) < -2) b.pendek++;
    if (s?.z_bbtb != null && Number(s.z_bbtb) < -2) b.kurus++;
    perBulan.set(bulan, b);
  }
  const tren = [...perBulan.entries()].sort(([a], [b]) => a.localeCompare(b));
  const NAMA_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  const antrean = anak
    .flatMap((a) => a.peringatanAktif.map((p) => ({ anak: a, p })))
    .sort((x, y) => Number(y.p.status === "baru") - Number(x.p.status === "baru") ||
      Number(y.p.tingkat === "bahaya") - Number(x.p.tingkat === "bahaya") || y.p.dibuatPada.localeCompare(x.p.dibuatPada));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Pantauan wilayah</h1>
      <p className="mt-1 text-sm text-redup">Rekap pengukuran terakhir tiap anak di posyandu binaan Anda.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-garis bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-redup">
            <tr className="border-b border-garis">
              <th scope="col" className="px-5 py-3 font-medium">Posyandu</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Anak</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Pendek / sangat pendek</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Gizi kurang / buruk</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Anak dengan peringatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-garis tabular-nums">
            {rekap.map((r) => (
              <tr key={r.nama}>
                <th scope="row" className="px-5 py-3 text-left font-semibold text-tinta">{r.nama}</th>
                <td className="px-3 py-3 text-right text-tinta">{r.total}</td>
                <td className="px-3 py-3 text-right"><span className={r.pendek ? "font-semibold text-waspada" : "text-tinta"}>{r.pendek}</span> <span className="text-redup">({persen(r.pendek, r.total)})</span></td>
                <td className="px-3 py-3 text-right"><span className={r.kurus ? "font-semibold text-waspada" : "text-tinta"}>{r.kurus}</span> <span className="text-redup">({persen(r.kurus, r.total)})</span></td>
                <td className="px-5 py-3 text-right"><span className={r.peringatan ? "font-semibold text-waspada" : "text-tinta"}>{r.peringatan}</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-garis bg-latar/60 tabular-nums">
            <tr>
              <th scope="row" className="px-5 py-3 text-left font-bold text-tinta">Total</th>
              <td className="px-3 py-3 text-right font-bold text-tinta">{total.total}</td>
              <td className="px-3 py-3 text-right font-bold text-tinta">{total.pendek} <span className="font-normal text-redup">({persen(total.pendek, total.total)})</span></td>
              <td className="px-3 py-3 text-right font-bold text-tinta">{total.kurus} <span className="font-normal text-redup">({persen(total.kurus, total.total)})</span></td>
              <td className="px-5 py-3 text-right font-bold text-tinta">{total.peringatan}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-bold text-tinta">Tren 6 bulan terakhir</h2>
      <p className="text-sm text-redup">Persentase dari anak yang ditimbang pada bulan tersebut.</p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-garis bg-white">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-left text-xs text-redup">
            <tr className="border-b border-garis">
              <th scope="col" className="px-5 py-3 font-medium">Bulan</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Anak ditimbang</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Pendek / sangat pendek</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Gizi kurang / buruk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-garis">
            {tren.map(([bulan, b]) => (
              <tr key={bulan}>
                <th scope="row" className="px-5 py-2.5 text-left font-semibold text-tinta">
                  {NAMA_BULAN[Number(bulan.slice(5, 7)) - 1]} {bulan.slice(0, 4)}
                </th>
                <td className="px-3 py-2.5 text-right text-tinta">{b.anak.size}</td>
                <td className="px-3 py-2.5 text-right"><span className="text-tinta">{b.pendek}</span> <span className="text-redup">({persen(b.pendek, b.total)})</span></td>
                <td className="px-5 py-2.5 text-right"><span className="text-tinta">{b.kurus}</span> <span className="text-redup">({persen(b.kurus, b.total)})</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-bold text-tinta">Peringatan yang perlu ditindaklanjuti <span className="font-normal text-redup">({antrean.length})</span></h2>
      <ul className="mt-3 space-y-3">
        {antrean.length === 0 && <li className="rounded-xl border border-garis bg-white px-5 py-6 text-redup">Tidak ada peringatan aktif.</li>}
        {antrean.map(({ anak: a, p }) => (
          <li key={p.id} className="rounded-xl border border-garis bg-white px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-tinta">
                {a.nama} <span className="text-sm font-normal text-redup">· {formatUmur(umurHari(a.tglLahir, hariIni))} · {a.posyanduNama} · Ibu {a.namaIbu}</span>
              </p>
              <p className="text-xs text-redup">{p.status === "baru" ? "Baru" : "Sedang ditindaklanjuti"} · {formatTanggal(p.dibuatPada)}</p>
            </div>
            <p className={`mt-1 font-semibold ${warnaTeks[p.tingkat]}`}>{JENIS[p.jenis] ?? p.jenis}</p>
            {a.terakhir && (
              <p className="text-sm text-redup">
                Terakhir ditimbang {formatTanggal(a.terakhir.tglUkur)}: {String(a.terakhir.beratKg).replace(".", ",")} kg,
                {" "}{String(a.terakhir.tinggiCm).replace(".", ",")} cm · TB/U {a.terakhir.tbu ? formatZ(a.terakhir.tbu.z) : "—"} · BB/TB {a.terakhir.bbtb ? formatZ(a.terakhir.bbtb.z) : "—"}
              </p>
            )}
            <FormTindak id={p.id} catatanAwal={p.status === "baru" ? "" : p.catatan ?? ""} />
          </li>
        ))}
      </ul>
    </div>
  );
}
