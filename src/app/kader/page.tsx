import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Memuat } from "@/components/app/Memuat";
import { wajibPeran } from "@/lib/auth";
import { daftarAnak } from "@/lib/data/kader";
import { umurHari } from "@/lib/gizi";
import { formatTanggal, formatUmur, hariIniWIB } from "@/lib/format";
import { warnaTeks } from "@/components/SkalaZ";

export const metadata: Metadata = { title: "Daftar anak" };

export default function BerandaKader({ searchParams }: PageProps<"/kader">) {
  return (
    <Suspense fallback={<Memuat />}>
      <DaftarAnakKader searchParams={searchParams} />
    </Suspense>
  );
}

async function DaftarAnakKader({ searchParams }: Pick<PageProps<"/kader">, "searchParams">) {
  await wajibPeran("kader");
  const { q } = await searchParams;
  const cari = typeof q === "string" ? q.trim() : "";
  const anak = await daftarAnak(cari || undefined);
  const hariIni = hariIniWIB();
  const bulanIni = hariIni.slice(0, 7);
  const sudahDitimbang = anak.filter((a) => a.terakhir?.tglUkur.startsWith(bulanIni)).length;
  const perluPerhatian = anak.filter((a) => a.peringatanAktif.length > 0);

  // Anak dengan peringatan didahulukan, lalu yang belum ditimbang bulan ini.
  const urut = [...anak].sort((x, y) =>
    Number(y.peringatanAktif.length > 0) - Number(x.peringatanAktif.length > 0) ||
    Number(!y.terakhir?.tglUkur.startsWith(bulanIni)) - Number(!x.terakhir?.tglUkur.startsWith(bulanIni)) ||
    x.nama.localeCompare(y.nama));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Anak di posyandu</h1>
          <p className="mt-1 text-sm text-redup">Ketuk nama anak untuk melihat grafik dan mencatat penimbangan.</p>
        </div>
        <Link href="/kader/anak/baru" className="rounded-lg bg-langit px-4 py-2.5 text-sm font-semibold text-white hover:bg-langit-tua">
          Daftarkan anak
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-3 divide-x divide-garis rounded-xl border border-garis bg-white">
        <div className="px-4 py-3">
          <dt className="text-xs text-redup">Anak terdaftar</dt>
          <dd className="text-2xl font-bold tabular-nums text-tinta">{anak.length}</dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-xs text-redup">Ditimbang bulan ini</dt>
          <dd className="text-2xl font-bold tabular-nums text-tinta">{sudahDitimbang}<span className="text-base font-medium text-redup">/{anak.length}</span></dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-xs text-redup">Perlu perhatian</dt>
          <dd className={`text-2xl font-bold tabular-nums ${perluPerhatian.length ? "text-waspada" : "text-tinta"}`}>{perluPerhatian.length}</dd>
        </div>
      </dl>

      <form className="mt-6" role="search">
        <label htmlFor="q" className="sr-only">Cari nama anak</label>
        <input id="q" name="q" defaultValue={cari} placeholder="Cari nama anak…"
          className="w-full rounded-lg border border-garis bg-white px-4 py-2.5 text-tinta outline-none focus:border-langit focus:ring-2 focus:ring-langit/20 sm:max-w-sm" />
      </form>

      <ul className="mt-4 divide-y divide-garis overflow-hidden rounded-xl border border-garis bg-white">
        {urut.length === 0 && <li className="px-5 py-8 text-center text-redup">{cari ? `Tidak ada anak bernama “${cari}”.` : "Belum ada anak terdaftar."}</li>}
        {urut.map((a) => {
          const t = a.terakhir;
          const bulanIniSudah = t?.tglUkur.startsWith(bulanIni);
          const peringatan = a.peringatanAktif[0];
          return (
            <li key={a.id}>
              <Link href={`/kader/anak/${a.id}`} className="grid gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-latar sm:grid-cols-[1.4fr_1fr_1fr_1.2fr] sm:items-center">
                <div>
                  <p className="font-semibold text-tinta">{a.nama}</p>
                  <p className="text-xs text-redup">
                    {a.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"} · {formatUmur(umurHari(a.tglLahir, hariIni))} · Ibu {a.namaIbu}
                  </p>
                </div>
                <p className="text-sm">
                  <span className="text-xs text-redup sm:block">PB/TB menurut umur </span>
                  <span className={`font-semibold ${t?.tbu ? warnaTeks[t.tbu.tingkat] : "text-redup"}`}>{t?.tbu?.label ?? "—"}</span>
                </p>
                <p className="text-sm">
                  <span className="text-xs text-redup sm:block">BB menurut PB/TB </span>
                  <span className={`font-semibold ${t?.bbtb ? warnaTeks[t.bbtb.tingkat] : "text-redup"}`}>{t?.bbtb?.label ?? "—"}</span>
                </p>
                <div className="text-sm">
                  <p className={bulanIniSudah ? "text-redup" : "font-semibold text-tinta"}>
                    {t ? `${bulanIniSudah ? "Ditimbang" : "Terakhir"} ${formatTanggal(t.tglUkur)}` : "Belum pernah ditimbang"}
                  </p>
                  {peringatan && (
                    <p className={`text-xs font-semibold ${warnaTeks[peringatan.tingkat]}`}>
                      {a.peringatanAktif.length} peringatan{peringatan.status === "ditindaklanjuti" ? " · sedang ditindaklanjuti" : ""}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
