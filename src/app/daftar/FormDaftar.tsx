"use client";

import Link from "next/link";
import { useActionState } from "react";
import { daftar, type StatusDaftar } from "./actions";

const input =
  "mt-1.5 w-full rounded-lg border border-garis bg-white px-3 py-2.5 text-tinta outline-none transition-colors focus:border-langit focus:ring-2 focus:ring-langit/20";

export function FormDaftar() {
  const [status, aksi, menunggu] = useActionState<StatusDaftar, FormData>(daftar, {});
  const f = status.fields ?? {};
  const pesan = (k: string) => f[k] && <p id={`${k}-galat`} role="alert" className="mt-1 text-sm text-bahaya">{f[k]}</p>;
  const tandai = (k: string) => (f[k] ? { "aria-invalid": true, "aria-describedby": `${k}-galat` } : {});

  return (
    <form action={aksi} noValidate className="space-y-4">
      <div>
        <label htmlFor="nama" className="block text-sm font-semibold text-tinta">Nama lengkap</label>
        <input id="nama" name="nama" autoComplete="name" required defaultValue={status.nilai?.nama} className={input} {...tandai("nama")} />
        {pesan("nama")}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-tinta">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={status.nilai?.email} className={input} {...tandai("email")} />
        {pesan("email")}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-tinta">Kata sandi</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required className={input} {...tandai("password")} />
        <p className="mt-1 text-xs text-redup">Minimal 8 karakter.</p>
        {pesan("password")}
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm text-tinta">
          <input type="checkbox" name="setuju" value="ya" className="mt-0.5 accent-langit" {...tandai("setuju")} />
          <span>
            Saya sudah membaca{" "}
            <Link href="/privasi" target="_blank" className="font-semibold text-langit-tua underline">kebijakan privasi</Link>{" "}
            dan setuju data akun saya diproses untuk memantau tumbuh kembang anak.
          </span>
        </label>
        {pesan("setuju")}
      </div>
      {status.galat && <p role="alert" className="text-sm text-bahaya">{status.galat}</p>}
      <button type="submit" disabled={menunggu}
        className="w-full rounded-lg bg-langit-tua px-5 py-3 font-semibold text-white transition-colors hover:bg-tinta disabled:opacity-60">
        {menunggu ? "Membuat akun…" : "Buat akun"}
      </button>
    </form>
  );
}
