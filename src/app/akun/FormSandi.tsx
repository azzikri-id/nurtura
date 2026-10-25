"use client";

import { useActionState } from "react";
import { gantiSandi, type StatusSandi } from "./actions";

const input =
  "mt-1.5 w-full rounded-lg border border-garis bg-white px-3 py-2.5 text-tinta outline-none transition-colors focus:border-langit focus:ring-2 focus:ring-langit/20";

export function FormSandi() {
  const [status, aksi, menunggu] = useActionState<StatusSandi, FormData>(gantiSandi, {});
  const f = status.fields ?? {};
  const pesan = (k: string) => f[k] && <p id={`${k}-galat`} role="alert" className="mt-1 text-sm text-bahaya">{f[k]}</p>;
  const tandai = (k: string) => (f[k] ? { "aria-invalid": true, "aria-describedby": `${k}-galat` } : {});

  return (
    <form key={status.berhasil ? "selesai" : "form"} action={aksi} noValidate className="space-y-4">
      <div>
        <label htmlFor="lama" className="block text-sm font-semibold text-tinta">Kata sandi saat ini</label>
        <input id="lama" name="lama" type="password" autoComplete="current-password" required className={input} {...tandai("lama")} />
        {pesan("lama")}
      </div>
      <div>
        <label htmlFor="baru" className="block text-sm font-semibold text-tinta">Kata sandi baru</label>
        <input id="baru" name="baru" type="password" autoComplete="new-password" required className={input} {...tandai("baru")} />
        <p className="mt-1 text-xs text-redup">Minimal 8 karakter.</p>
        {pesan("baru")}
      </div>
      {status.galat && <p role="alert" className="text-sm text-bahaya">{status.galat}</p>}
      {status.berhasil && <p role="status" className="text-sm text-normal">Kata sandi berhasil diganti.</p>}
      <button type="submit" disabled={menunggu}
        className="rounded-lg bg-langit-tua px-5 py-3 font-semibold text-white transition-colors hover:bg-tinta disabled:opacity-60">
        {menunggu ? "Menyimpan…" : "Ganti kata sandi"}
      </button>
    </form>
  );
}
