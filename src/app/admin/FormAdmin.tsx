"use client";

import { useActionState, useState } from "react";
import { aturUlangSandi, buatAkun, tambahPosyandu, ubahStatusAkun, type StatusAdmin } from "./actions";

const input =
  "mt-1.5 w-full rounded-lg border border-garis bg-white px-3 py-2.5 text-tinta outline-none transition-colors focus:border-langit focus:ring-2 focus:ring-langit/20";
const tombol =
  "rounded-lg bg-langit-tua px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tinta disabled:opacity-60";

type Opsi = { id: string; nama: string };

function Pesan({ id, teks }: { id: string; teks?: string }) {
  return teks ? <p id={id} role="alert" className="mt-1 text-sm text-bahaya">{teks}</p> : null;
}

/** Kata sandi sementara: tampil sekali, tidak disimpan di server maupun log. */
function KotakSandi({ sandi }: { sandi: NonNullable<StatusAdmin["sandi"]> }) {
  return (
    <div role="status" className="mt-4 rounded-lg border border-waspada/40 bg-waspada-latar px-4 py-3 text-sm text-tinta">
      <p className="font-semibold text-waspada">Catat sekarang, kata sandi ini tidak akan ditampilkan lagi</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-redup">Email</dt><dd className="break-all font-mono">{sandi.email}</dd>
        <dt className="text-redup">Kata sandi sementara</dt><dd className="font-mono font-bold">{sandi.sandi}</dd>
      </dl>
      <p className="mt-2 text-xs text-redup">Sarankan pengguna segera menggantinya lewat menu Akun saya.</p>
    </div>
  );
}

export function FormPosyandu({ puskesmas, desa }: { puskesmas: Opsi[]; desa: Opsi[] }) {
  const [s, aksi, menunggu] = useActionState<StatusAdmin, FormData>(tambahPosyandu, {});
  const f = s.fields ?? {};
  return (
    <details className="group mt-4 rounded-xl border border-garis bg-white">
      <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-langit-tua [&::-webkit-details-marker]:hidden">
        Tambah posyandu
      </summary>
      <form action={aksi} noValidate className="space-y-4 border-t border-garis px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-nama" className="block text-sm font-semibold text-tinta">Nama posyandu</label>
            <input id="p-nama" name="nama" required className={input} aria-invalid={!!f.nama} aria-describedby="p-nama-g" />
            <Pesan id="p-nama-g" teks={f.nama} />
          </div>
          <div>
            <label htmlFor="p-alamat" className="block text-sm font-semibold text-tinta">Alamat <span className="font-normal text-redup">opsional</span></label>
            <input id="p-alamat" name="alamat" className={input} aria-invalid={!!f.alamat} aria-describedby="p-alamat-g" />
            <Pesan id="p-alamat-g" teks={f.alamat} />
          </div>
          <div>
            <label htmlFor="p-pkm" className="block text-sm font-semibold text-tinta">Puskesmas pembina</label>
            <select id="p-pkm" name="puskesmasId" defaultValue="" className={input} aria-invalid={!!f.puskesmasId} aria-describedby="p-pkm-g">
              <option value="" disabled>Pilih puskesmas</option>
              {puskesmas.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
            <Pesan id="p-pkm-g" teks={f.puskesmasId} />
          </div>
          <div>
            <label htmlFor="p-desa" className="block text-sm font-semibold text-tinta">Desa/kelurahan</label>
            <select id="p-desa" name="wilayahId" defaultValue="" className={input} aria-invalid={!!f.wilayahId} aria-describedby="p-desa-g">
              <option value="" disabled>Pilih desa/kelurahan</option>
              {desa.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
            <Pesan id="p-desa-g" teks={f.wilayahId} />
          </div>
        </div>
        {s.galat && <p role="alert" className="text-sm text-bahaya">{s.galat}</p>}
        {s.berhasil && <p role="status" className="text-sm text-normal">{s.berhasil}</p>}
        <button type="submit" disabled={menunggu} className={tombol}>{menunggu ? "Menyimpan…" : "Simpan posyandu"}</button>
      </form>
    </details>
  );
}

export function FormAkun({ posyandu, puskesmas }: { posyandu: Opsi[]; puskesmas: Opsi[] }) {
  const [s, aksi, menunggu] = useActionState<StatusAdmin, FormData>(buatAkun, {});
  const [peran, setPeran] = useState("kader");
  const f = s.fields ?? {};
  return (
    <details className="group mt-4 rounded-xl border border-garis bg-white">
      <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-langit-tua [&::-webkit-details-marker]:hidden">
        Buat akun kader atau bidan
      </summary>
      <form action={aksi} noValidate className="space-y-4 border-t border-garis px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="a-nama" className="block text-sm font-semibold text-tinta">Nama lengkap</label>
            <input id="a-nama" name="nama" autoComplete="off" required className={input} aria-invalid={!!f.nama} aria-describedby="a-nama-g" />
            <Pesan id="a-nama-g" teks={f.nama} />
          </div>
          <div>
            <label htmlFor="a-email" className="block text-sm font-semibold text-tinta">Email</label>
            <input id="a-email" name="email" type="email" autoComplete="off" required className={input} aria-invalid={!!f.email} aria-describedby="a-email-g" />
            <Pesan id="a-email-g" teks={f.email} />
          </div>
          <div>
            <label htmlFor="a-peran" className="block text-sm font-semibold text-tinta">Peran</label>
            <select id="a-peran" name="peran" value={peran} onChange={(e) => setPeran(e.target.value)} className={input}>
              <option value="kader">Kader posyandu</option>
              <option value="bidan">Bidan</option>
            </select>
          </div>
          {peran === "kader" ? (
            <div>
              <label htmlFor="a-posyandu" className="block text-sm font-semibold text-tinta">Posyandu tempat bertugas</label>
              <select id="a-posyandu" name="posyanduId" defaultValue="" className={input} aria-invalid={!!f.posyanduId} aria-describedby="a-posyandu-g">
                <option value="" disabled>Pilih posyandu</option>
                {posyandu.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
              <Pesan id="a-posyandu-g" teks={f.posyanduId} />
            </div>
          ) : (
            <div>
              <label htmlFor="a-pkm" className="block text-sm font-semibold text-tinta">Puskesmas tempat bertugas</label>
              <select id="a-pkm" name="puskesmasId" defaultValue="" className={input} aria-invalid={!!f.puskesmasId} aria-describedby="a-pkm-g">
                <option value="" disabled>Pilih puskesmas</option>
                {puskesmas.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
              <Pesan id="a-pkm-g" teks={f.puskesmasId} />
            </div>
          )}
          <div className="sm:col-span-2">
            <label htmlFor="a-sandi" className="block text-sm font-semibold text-tinta">
              Kata sandi sementara <span className="font-normal text-redup">kosongkan agar dibuat otomatis</span>
            </label>
            <input id="a-sandi" name="sandi" autoComplete="off" className={input} aria-invalid={!!f.sandi} aria-describedby="a-sandi-g" />
            <Pesan id="a-sandi-g" teks={f.sandi} />
          </div>
        </div>
        {s.galat && <p role="alert" className="text-sm text-bahaya">{s.galat}</p>}
        {s.berhasil && <p role="status" className="text-sm text-normal">{s.berhasil}</p>}
        {s.sandi && <KotakSandi sandi={s.sandi} />}
        <button type="submit" disabled={menunggu} className={tombol}>{menunggu ? "Membuat akun…" : "Buat akun"}</button>
      </form>
    </details>
  );
}

/** Aksi per akun staf: atur ulang kata sandi dan nonaktifkan/aktifkan. */
export function AksiAkun({ id, nama, aktif }: { id: string; nama: string; aktif: boolean }) {
  const [sandi, aksiSandi, menungguSandi] = useActionState<StatusAdmin>(() => aturUlangSandi(id), {});
  const [status, aksiStatus, menungguStatus] = useActionState<StatusAdmin>(() => ubahStatusAkun(id, !aktif), {});
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={aksiSandi}>
        <button disabled={menungguSandi} aria-label={`Atur ulang kata sandi ${nama}`}
          className="rounded-lg border border-tinta/15 px-3 py-1.5 text-xs font-semibold text-tinta hover:border-langit disabled:opacity-60">
          Atur ulang sandi
        </button>
      </form>
      <form action={aksiStatus}>
        <button disabled={menungguStatus} aria-label={`${aktif ? "Nonaktifkan" : "Aktifkan"} akun ${nama}`}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${aktif ? "text-bahaya hover:bg-bahaya-latar" : "text-langit-tua hover:bg-latar"}`}>
          {aktif ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </form>
      <div className="w-full">
        {(sandi.galat || status.galat) && <p role="alert" className="text-xs text-bahaya">{sandi.galat ?? status.galat}</p>}
        {status.berhasil && <p role="status" className="text-xs text-normal">{status.berhasil}</p>}
        {sandi.sandi && <KotakSandi sandi={sandi.sandi} />}
      </div>
    </div>
  );
}
