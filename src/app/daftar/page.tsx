import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BERANDA, getPengguna } from "@/lib/auth";
import { FormDaftar } from "./FormDaftar";

export const metadata: Metadata = { title: "Daftar" };

/** Pengguna yang sudah masuk langsung diarahkan ke berandanya. */
async function AlihkanBilaSudahMasuk() {
  const pengguna = await getPengguna();
  if (pengguna) redirect(BERANDA[pengguna.peran]);
  return null;
}

const LANGKAH = [
  ["Buat akun", "Isi nama, email, dan kata sandi. Tidak perlu data anak pada tahap ini."],
  ["Minta kode undangan", "Kader posyandu memberi kode saat mendaftarkan anak Anda atau saat penimbangan."],
  ["Tautkan anak Anda", "Masukkan kode di beranda. Status gizi dan grafik pertumbuhan langsung tampil."],
];

export default function HalamanDaftar() {
  return (
    <main className="grid flex-1 lg:grid-cols-2">
      <section className="flex flex-col px-6 py-10 sm:px-12">
        <Link href="/" aria-label="Kembali ke beranda Nurtura">
          <Image src="/brand/nurtura-logo-horizontal.svg" alt="Nurtura" width={132} height={33} priority />
        </Link>
        <div className="mx-auto w-full max-w-sm flex-1 content-center py-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-tinta">Daftar sebagai orang tua</h1>
          <p className="mt-2 text-redup">Pantau tumbuh kembang anak dari rumah. Akun kader dan bidan dibuat oleh puskesmas.</p>
          <div className="mt-8">
            <Suspense fallback={null}><AlihkanBilaSudahMasuk /></Suspense>
            <FormDaftar />
          </div>
          <p className="mt-6 text-sm text-redup">
            Sudah punya akun? <Link href="/masuk" className="font-semibold text-langit-tua underline">Masuk</Link>
          </p>
        </div>
      </section>

      <section className="border-t border-garis bg-latar px-6 py-10 sm:px-12 lg:border-l lg:border-t-0">
        <div className="mx-auto max-w-md lg:mt-24">
          <h2 className="text-lg font-bold text-tinta">Setelah mendaftar</h2>
          <ol className="mt-4 divide-y divide-garis border-y border-garis">
            {LANGKAH.map(([judul, isi], i) => (
              <li key={judul} className="flex gap-4 py-4">
                <span className="text-sm font-bold tabular-nums text-langit-tua">0{i + 1}</span>
                <div>
                  <p className="font-semibold text-tinta">{judul}</p>
                  <p className="mt-0.5 text-sm text-redup">{isi}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-redup">
            Data anak hanya bisa dilihat oleh Anda, kader posyandu, dan bidan wilayah. Anda bisa mengunduh atau menghapusnya kapan saja.
          </p>
        </div>
      </section>
    </main>
  );
}
