"use client";

import { useActionState } from "react";
import { masuk, masukDemo, type StatusMasuk } from "./actions";
import type { Peran } from "@/lib/auth";

const input =
  "mt-1.5 w-full rounded-lg border border-garis bg-white px-3 py-2.5 text-tinta outline-none transition-colors focus:border-langit focus:ring-2 focus:ring-langit/20";

export function FormMasuk({ lanjut }: { lanjut?: string }) {
  const [status, aksi, menunggu] = useActionState<StatusMasuk, FormData>(masuk, {});
  return (
    <form action={aksi} className="space-y-4">
      <input type="hidden" name="lanjut" value={lanjut ?? ""} />
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-tinta">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={status.email} className={input} />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-tinta">Kata sandi</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      {status.galat && <p role="alert" className="text-sm text-bahaya">{status.galat}</p>}
      <button type="submit" disabled={menunggu}
        className="w-full rounded-lg bg-langit px-5 py-3 font-semibold text-white transition-colors hover:bg-langit-tua disabled:opacity-60">
        {menunggu ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}

export function TombolDemo({ peran, judul, keterangan }: { peran: Peran; judul: string; keterangan: string }) {
  const [status, aksi, menunggu] = useActionState<StatusMasuk>(() => masukDemo(peran), {});
  return (
    <form action={aksi}>
      <button type="submit" disabled={menunggu}
        className="group flex w-full items-center justify-between gap-4 py-4 text-left disabled:opacity-60">
        <span>
          <span className="block font-semibold text-tinta group-hover:text-langit-tua">{judul}</span>
          <span className="block text-sm text-redup">{keterangan}</span>
        </span>
        <span aria-hidden className="text-langit transition-transform group-hover:translate-x-0.5">
          {menunggu ? "…" : "→"}
        </span>
      </button>
      {status.galat && <p role="alert" className="pb-3 text-sm text-bahaya">{status.galat}</p>}
    </form>
  );
}
