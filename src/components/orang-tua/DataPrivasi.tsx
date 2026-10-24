"use client";

import { useActionState, useState } from "react";
import { hapusDataAnak, type StatusHapus } from "@/app/orang-tua/actions";

export function DataPrivasi({ anakId, namaAnak }: { anakId: string; namaAnak: string }) {
  const [buka, setBuka] = useState(false);
  const [status, aksi, menunggu] = useActionState<StatusHapus, FormData>(hapusDataAnak.bind(null, anakId, namaAnak), {});
  const panggilan = namaAnak.split(" ")[0];

  return (
    <section className="rounded-xl border border-garis bg-white p-5">
      <h2 className="font-bold text-tinta">Data & privasi</h2>
      <p className="mt-1 text-sm text-redup">
        Data {panggilan} hanya bisa dilihat kader posyandu, bidan wilayah, dan Anda.{" "}
        <a href="/privasi" className="font-semibold text-langit-tua underline decoration-langit/30 underline-offset-2">Baca kebijakan privasi</a>.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={`/api/v1/anak/${anakId}/ekspor`} download
          className="rounded-lg border border-tinta/15 px-4 py-2 text-sm font-semibold text-tinta hover:border-langit">
          Unduh data {panggilan}
        </a>
        <button type="button" onClick={() => setBuka((b) => !b)} aria-expanded={buka}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-bahaya hover:bg-bahaya-latar">
          Hapus data {panggilan}
        </button>
      </div>
      {buka && (
        <form action={aksi} className="mt-4 rounded-lg border border-bahaya/30 bg-bahaya-latar p-4 text-sm">
          <p className="text-tinta">
            Semua data {panggilan} (identitas, riwayat penimbangan, peringatan) akan dihapus permanen dan tidak bisa dikembalikan.
            Ketik <b>{panggilan}</b> untuk melanjutkan.
          </p>
          <label htmlFor={`konfirmasi-${anakId}`} className="sr-only">Konfirmasi nama anak</label>
          <div className="mt-3 flex flex-wrap gap-3">
            <input id={`konfirmasi-${anakId}`} name="konfirmasi" autoComplete="off"
              className="rounded-lg border border-garis bg-white px-3 py-2 text-tinta outline-none focus:border-bahaya" />
            <button type="submit" disabled={menunggu}
              className="rounded-lg bg-bahaya px-4 py-2 font-semibold text-white disabled:opacity-60">
              {menunggu ? "Menghapus…" : "Hapus permanen"}
            </button>
          </div>
          {status.galat && <p role="alert" className="mt-2 text-bahaya">{status.galat}</p>}
        </form>
      )}
    </section>
  );
}
