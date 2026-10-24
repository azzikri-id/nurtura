"use client";

import { useActionState } from "react";
import { tindakLanjut, type StatusTindak } from "./actions";

export function FormTindak({ id, catatanAwal }: { id: string; catatanAwal: string }) {
  const [status, aksi, menunggu] = useActionState<StatusTindak, FormData>(tindakLanjut.bind(null, id), {});
  return (
    <form action={aksi} className="mt-3 space-y-2">
      <label htmlFor={`catatan-${id}`} className="sr-only">Catatan tindak lanjut</label>
      <textarea id={`catatan-${id}`} name="catatan" rows={2} defaultValue={catatanAwal}
        placeholder="mis. kunjungan rumah 25 Okt, edukasi MPASI, rujuk ke puskesmas"
        className="w-full rounded-lg border border-garis bg-white px-3 py-2 text-sm text-tinta outline-none focus:border-langit focus:ring-2 focus:ring-langit/20" />
      <div className="flex flex-wrap items-center gap-2">
        <button name="status" value="ditindaklanjuti" disabled={menunggu}
          className="rounded-lg border border-tinta/15 px-3 py-1.5 text-sm font-semibold text-tinta hover:border-langit disabled:opacity-60">
          Sedang ditindaklanjuti
        </button>
        <button name="status" value="selesai" disabled={menunggu}
          className="rounded-lg bg-langit px-3 py-1.5 text-sm font-semibold text-white hover:bg-langit-tua disabled:opacity-60">
          Tandai selesai
        </button>
        {status.galat && <p role="alert" className="text-sm text-bahaya">{status.galat}</p>}
        {status.berhasil && <p role="status" className="text-sm text-normal">Tersimpan.</p>}
      </div>
    </form>
  );
}
