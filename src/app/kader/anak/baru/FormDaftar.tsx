"use client";

import { useActionState } from "react";
import { daftarkanAnak, type StatusDaftar } from "./actions";

const input =
  "mt-1.5 w-full rounded-lg border border-garis bg-white px-3 py-2.5 text-tinta outline-none transition-colors focus:border-langit focus:ring-2 focus:ring-langit/20 aria-[invalid=true]:border-bahaya";
const label = "block text-sm font-semibold text-tinta";

export function FormDaftar({ posyandu, hariIni }: { posyandu: { id: string; nama: string }[]; hariIni: string }) {
  const [status, aksi, menunggu] = useActionState<StatusDaftar, FormData>(daftarkanAnak, {});
  const n = status.nilai ?? {};
  const g = status.galat ?? {};
  const err = (k: string) => g[k] && <p id={`g-${k}`} className="mt-1 text-sm text-bahaya">{g[k]}</p>;
  const a = (k: string) => ({ "aria-invalid": !!g[k], "aria-describedby": g[k] ? `g-${k}` : undefined });

  return (
    <form action={aksi} noValidate className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wide text-redup">Anak</legend>
        {posyandu.length > 1 ? (
          <div>
            <label htmlFor="posyanduId" className={label}>Posyandu</label>
            <select id="posyanduId" name="posyanduId" defaultValue={n.posyanduId} className={input} {...a("posyanduId")}>
              {posyandu.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
            {err("posyanduId")}
          </div>
        ) : (
          <input type="hidden" name="posyanduId" value={posyandu[0]?.id ?? ""} />
        )}
        <div>
          <label htmlFor="nama" className={label}>Nama anak</label>
          <input id="nama" name="nama" defaultValue={n.nama} className={input} {...a("nama")} />
          {err("nama")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tglLahir" className={label}>Tanggal lahir</label>
            <input id="tglLahir" name="tglLahir" type="date" max={hariIni} defaultValue={n.tglLahir} className={input} {...a("tglLahir")} />
            {err("tglLahir")}
          </div>
          <fieldset>
            <legend className={label}>Jenis kelamin</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {([["L", "Laki-laki"], ["P", "Perempuan"]] as const).map(([v, t]) => (
                <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-garis bg-white px-3 py-2.5 text-tinta has-[:checked]:border-langit has-[:checked]:bg-latar">
                  <input type="radio" name="jenisKelamin" value={v} defaultChecked={n.jenisKelamin === v} className="accent-langit" />
                  {t}
                </label>
              ))}
            </div>
            {err("jenisKelamin")}
          </fieldset>
        </div>
        <div>
          <label htmlFor="nik" className={label}>NIK anak <span className="font-normal text-redup">opsional, disimpan terenkripsi</span></label>
          <input id="nik" name="nik" inputMode="numeric" maxLength={16} defaultValue={n.nik} className={input} {...a("nik")} />
          {err("nik")}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wide text-redup">Orang tua</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="namaIbu" className={label}>Nama ibu</label>
            <input id="namaIbu" name="namaIbu" defaultValue={n.namaIbu} className={input} {...a("namaIbu")} />
            {err("namaIbu")}
          </div>
          <div>
            <label htmlFor="namaAyah" className={label}>Nama ayah <span className="font-normal text-redup">opsional</span></label>
            <input id="namaAyah" name="namaAyah" defaultValue={n.namaAyah} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="alamat" className={label}>Alamat <span className="font-normal text-redup">opsional</span></label>
          <input id="alamat" name="alamat" placeholder="mis. RT 02/RW 05" defaultValue={n.alamat} className={input} />
        </div>
      </fieldset>

      <div className="rounded-lg border border-garis bg-white px-4 py-3">
        <label className="flex items-start gap-3 text-sm text-tinta">
          <input type="checkbox" name="setuju" value="ya" defaultChecked={n.setuju === "ya"} className="mt-0.5 accent-langit" {...a("setuju")} />
          <span>
            Orang tua sudah dijelaskan dan <b>menyetujui</b> data anak dicatat di Nurtura untuk pemantauan tumbuh kembang.
            Data hanya dapat dilihat kader posyandu, bidan wilayah, dan orang tua sendiri, serta dapat diminta untuk dihapus (<a href="/privasi" target="_blank" className="font-semibold text-langit-tua underline">kebijakan privasi</a>).
          </span>
        </label>
        {err("setuju")}
      </div>

      {err("umum")}
      <button type="submit" disabled={menunggu}
        className="rounded-lg bg-langit-tua px-5 py-3 font-semibold text-white transition-colors hover:bg-tinta disabled:opacity-60">
        {menunggu ? "Menyimpan…" : "Daftarkan anak"}
      </button>
    </form>
  );
}
