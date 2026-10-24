"use client";

import { useActionState } from "react";
import { klaimKode, type StatusKlaim } from "./actions";

export function FormKlaim() {
  const [status, aksi, menunggu] = useActionState<StatusKlaim, FormData>(klaimKode, {});
  return (
    <form action={aksi} className="mt-4 flex flex-wrap items-start gap-3">
      <div>
        <label htmlFor="kode" className="sr-only">Kode undangan</label>
        <input id="kode" name="kode" maxLength={8} placeholder="Kode dari kader" autoCapitalize="characters"
          className="w-48 rounded-lg border border-garis bg-white px-3 py-2.5 font-mono uppercase tracking-widest text-tinta outline-none focus:border-langit focus:ring-2 focus:ring-langit/20" />
        {status.galat && <p role="alert" className="mt-1 max-w-sm text-sm text-bahaya">{status.galat}</p>}
      </div>
      <button type="submit" disabled={menunggu}
        className="rounded-lg bg-langit px-4 py-2.5 font-semibold text-white hover:bg-langit-tua disabled:opacity-60">
        {menunggu ? "Memeriksa…" : "Tautkan"}
      </button>
    </form>
  );
}
