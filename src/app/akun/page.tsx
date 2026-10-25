import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BilahAtas } from "@/components/app/BilahAtas";
import { Memuat } from "@/components/app/Memuat";
import { BERANDA, NAMA_PERAN, getPengguna } from "@/lib/auth";
import { FormSandi } from "./FormSandi";

export const metadata: Metadata = { title: "Akun saya" };

async function Isi() {
  const pengguna = await getPengguna();
  if (!pengguna) redirect("/masuk");
  return (
    <>
      <BilahAtas pengguna={pengguna} beranda={BERANDA[pengguna.peran]} konteks="Akun saya" />
      <main className="flex-1 bg-latar">
        <div className="mx-auto max-w-md px-6 py-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Akun saya</h1>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-redup">Nama</dt><dd className="font-semibold text-tinta">{pengguna.nama}</dd>
            <dt className="text-redup">Email</dt><dd className="break-all text-tinta">{pengguna.email}</dd>
            <dt className="text-redup">Peran</dt><dd className="text-tinta">{NAMA_PERAN[pengguna.peran]}</dd>
          </dl>
          <h2 className="mt-8 text-lg font-bold text-tinta">Ganti kata sandi</h2>
          <div className="mt-4 rounded-xl border border-garis bg-white p-5">
            <FormSandi />
          </div>
        </div>
      </main>
    </>
  );
}

export default function HalamanAkun() {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi />
    </Suspense>
  );
}
