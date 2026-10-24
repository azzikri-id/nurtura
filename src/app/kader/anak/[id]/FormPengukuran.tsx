"use client";

import { useActionState } from "react";
import { simpanPengukuran, type StatusSimpan } from "./actions";
import { formatTanggal } from "@/lib/format";

const input =
  "mt-1.5 w-full rounded-lg border border-garis bg-white px-3 py-2.5 text-tinta outline-none transition-colors focus:border-langit focus:ring-2 focus:ring-langit/20 aria-[invalid=true]:border-bahaya";
const label = "block text-sm font-semibold text-tinta";

export function FormPengukuran({ anakId, hariIni, caraBawaan }: { anakId: string; hariIni: string; caraBawaan: "terlentang" | "berdiri" }) {
  const [status, aksi, menunggu] = useActionState<StatusSimpan, FormData>(simpanPengukuran.bind(null, anakId), {});
  const n = status.nilai ?? {};
  const galat = status.galat ?? {};
  const masalahKolom = new Set(status.masalah?.map((m) => m.kolom));
  const pesan = (k: string) => galat[k] && <p id={`galat-${k}`} className="mt-1 text-sm text-bahaya">{galat[k]}</p>;
  const tandai = (k: string) => ({
    "aria-invalid": !!galat[k] || masalahKolom.has(k as "beratKg"),
    "aria-describedby": galat[k] ? `galat-${k}` : undefined,
  });

  return (
    // key: kosongkan form setelah berhasil disimpan
    <form key={status.berhasil?.tglUkur ?? "form"} action={aksi} noValidate className="space-y-4">
      {status.berhasil && (
        <p role="status" className="rounded-lg bg-normal-latar px-4 py-3 text-sm text-normal">
          Pengukuran {formatTanggal(status.berhasil.tglUkur)} tersimpan.
          {status.berhasil.peringatan > 0 && ` ${status.berhasil.peringatan} peringatan baru dikirim ke bidan.`}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tglUkur" className={label}>Tanggal ukur</label>
          <input id="tglUkur" name="tglUkur" type="date" max={hariIni} defaultValue={n.tglUkur ?? hariIni} className={input} {...tandai("tglUkur")} />
          {pesan("tglUkur")}
        </div>
        <div>
          <label htmlFor="caraUkur" className={label}>Cara ukur</label>
          <select id="caraUkur" name="caraUkur" defaultValue={n.caraUkur ?? caraBawaan} className={input}>
            <option value="terlentang">Terlentang (panjang badan)</option>
            <option value="berdiri">Berdiri (tinggi badan)</option>
          </select>
        </div>
        <div>
          <label htmlFor="beratKg" className={label}>Berat badan (kg)</label>
          <input id="beratKg" name="beratKg" inputMode="decimal" placeholder="mis. 8,6" defaultValue={n.beratKg} className={input} {...tandai("beratKg")} />
          {pesan("beratKg")}
        </div>
        <div>
          <label htmlFor="tinggiCm" className={label}>Panjang/tinggi badan (cm)</label>
          <input id="tinggiCm" name="tinggiCm" inputMode="decimal" placeholder="mis. 72,4" defaultValue={n.tinggiCm} className={input} {...tandai("tinggiCm")} />
          {pesan("tinggiCm")}
        </div>
        <div>
          <label htmlFor="lingkarKepalaCm" className={label}>Lingkar kepala (cm) <span className="font-normal text-redup">opsional</span></label>
          <input id="lingkarKepalaCm" name="lingkarKepalaCm" inputMode="decimal" defaultValue={n.lingkarKepalaCm} className={input} />
        </div>
      </div>

      {status.masalah && (
        <div role="alert" className="rounded-lg border border-waspada/40 bg-waspada-latar px-4 py-3 text-sm">
          <p className="font-semibold text-waspada">Periksa kembali sebelum menyimpan</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-tinta">
            {status.masalah.map((m) => <li key={m.pesan}>{m.pesan}</li>)}
          </ul>
          <label className="mt-3 flex items-start gap-2 text-tinta">
            <input type="checkbox" name="konfirmasi" value="ya" className="mt-1 accent-langit" />
            Angka sudah benar, tetap simpan
          </label>
          <label htmlFor="alasan" className="mt-2 block text-xs font-semibold text-tinta">Alasan</label>
          <input id="alasan" name="alasan" placeholder="mis. anak baru sembuh diare" className={input} {...tandai("alasan")} />
          {pesan("alasan")}
        </div>
      )}

      {pesan("umum")}
      <button type="submit" disabled={menunggu}
        className="w-full rounded-lg bg-langit px-5 py-3 font-semibold text-white transition-colors hover:bg-langit-tua disabled:opacity-60 sm:w-auto">
        {menunggu ? "Menyimpan…" : "Simpan pengukuran"}
      </button>
    </form>
  );
}
