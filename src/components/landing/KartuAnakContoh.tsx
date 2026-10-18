import { hitungStatusGizi } from "@/lib/gizi";
import { SkalaZ, warnaTeks, type Indikator } from "@/components/SkalaZ";
import { GrafikBBU } from "./GrafikBBU";
import { CONTOH_BERAT_BULANAN, CONTOH_PENGUKURAN } from "./contoh";

const formatZ = (z: number) => z.toFixed(2).replace(".", ",").replace("-", "−");

/** Kartu anak seperti yang dilihat kader di aplikasi, dihitung dengan modul z-score asli. */
export function KartuAnakContoh() {
  const status = hitungStatusGizi(CONTOH_PENGUKURAN);
  const indikator: { nama: string; kode: Indikator; hasil: typeof status.bbu }[] = [
    { nama: "BB/U", kode: "bbu", hasil: status.bbu },
    { nama: "PB/U", kode: "tbu", hasil: status.tbu },
    { nama: "BB/PB", kode: "bbtb", hasil: status.bbtb },
  ];

  return (
    <figure className="rounded-2xl border border-garis bg-white shadow-[0_1px_2px_rgba(23,80,122,0.06),0_12px_32px_-16px_rgba(23,80,122,0.25)]">
      <div className="flex flex-col gap-3 border-b border-garis px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-latar text-sm font-bold text-tinta">
            BS
          </span>
          <div>
            <p className="font-bold text-tinta">Budi Santoso</p>
            <p className="text-xs text-redup">Laki-laki · {Math.floor(status.umurBulan)} bulan</p>
          </div>
        </div>
        <p className="text-xs text-redup sm:text-right">
          <span className="font-semibold text-tinta">Posyandu Mawar</span>
          <span className="sm:hidden"> · </span>
          <br className="hidden sm:block" />
          Ditimbang 18 Okt 2026
        </p>
      </div>

      <dl className="divide-y divide-garis border-b border-garis px-5">
        {indikator.map(({ nama, kode, hasil }) => (
          <div key={nama} className="grid grid-cols-[3.25rem_1fr_3.5rem] items-center gap-3 py-2.5">
            <dt className="text-xs font-semibold tracking-wide text-redup">{nama}</dt>
            <dd>
              {hasil && (
                <>
                  <p className={`text-sm font-semibold ${warnaTeks[hasil.kategori.tingkat]}`}>{hasil.kategori.label}</p>
                  <SkalaZ indikator={kode} z={hasil.z} />
                </>
              )}
            </dd>
            <dd className="text-right font-bold tabular-nums text-tinta">{hasil ? formatZ(hasil.z) : "—"}</dd>
          </div>
        ))}
      </dl>

      <div className="px-4 pt-3">
        <p className="px-1 text-xs font-semibold text-tinta">Berat badan menurut umur (kg)</p>
        <GrafikBBU jk={CONTOH_PENGUKURAN.jenisKelamin} data={CONTOH_BERAT_BULANAN.map((kg, bulan) => ({ bulan, kg }))} />
      </div>

      <figcaption className="m-4 mt-1 rounded-xl bg-waspada-latar px-4 py-3 text-sm">
        <p className="font-semibold text-waspada">Berat tidak naik 2 bulan berturut-turut</p>
        <p className="mt-0.5 text-tinta/80">Peringatan dikirim ke bidan Puskesmas Sukamaju untuk kunjungan rumah.</p>
      </figcaption>
    </figure>
  );
}
