import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Memuat } from "@/components/app/Memuat";
import { wajibPeran } from "@/lib/auth";
import { posyanduSaya } from "@/lib/data/kader";
import { hariIniWIB } from "@/lib/format";
import { FormDaftar } from "./FormDaftar";

export const metadata: Metadata = { title: "Daftarkan anak" };

async function Isi() {
  const kader = await wajibPeran("kader");
  const posyandu = await posyanduSaya(kader.id);
  return <FormDaftar posyandu={posyandu} hariIni={hariIniWIB()} />;
}

export default function HalamanDaftarAnak() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/kader" className="text-sm font-semibold text-langit-tua hover:underline">← Daftar anak</Link>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-tinta">Daftarkan anak</h1>
      <p className="mt-1 mb-8 text-sm text-redup">Setelah tersimpan, Anda langsung bisa mencatat penimbangan pertamanya.</p>
      <Suspense fallback={<Memuat />}>
        <Isi />
      </Suspense>
    </div>
  );
}
