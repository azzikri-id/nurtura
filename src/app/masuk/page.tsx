import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BERANDA, NAMA_PERAN, getPengguna } from "@/lib/auth";
import { AKUN_DEMO, PASSWORD_DEMO } from "@/lib/demo";
import { FormMasuk, TombolDemo } from "./FormMasuk";

export const metadata: Metadata = { title: "Masuk" };

/** Pengguna yang sudah masuk langsung diarahkan ke berandanya. */
async function AlihkanBilaSudahMasuk() {
  const pengguna = await getPengguna();
  if (pengguna) redirect(BERANDA[pengguna.peran]);
  return null;
}

async function FormDenganTujuan({ searchParams }: Pick<PageProps<"/masuk">, "searchParams">) {
  const { lanjut } = await searchParams;
  return <FormMasuk lanjut={typeof lanjut === "string" ? lanjut : undefined} />;
}

export default function HalamanMasuk({ searchParams }: PageProps<"/masuk">) {
  return (
    <main className="grid flex-1 lg:grid-cols-2">
      <section className="flex flex-col px-6 py-10 sm:px-12">
        <Link href="/" aria-label="Kembali ke beranda Nurtura">
          <Image src="/brand/nurtura-logo-horizontal.svg" alt="Nurtura" width={132} height={33} priority />
        </Link>
        <div className="mx-auto w-full max-w-sm flex-1 content-center py-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-tinta">Masuk ke Nurtura</h1>
          <p className="mt-2 text-redup">Gunakan akun yang diberikan puskesmas atau kader posyandu Anda.</p>
          <div className="mt-8">
            <Suspense fallback={<FormMasuk />}>
              <AlihkanBilaSudahMasuk />
              <FormDenganTujuan searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="border-t border-garis bg-latar px-6 py-10 sm:px-12 lg:border-l lg:border-t-0">
        <div className="mx-auto max-w-md lg:mt-24">
          <h2 className="text-lg font-bold text-tinta">Coba sebagai…</h2>
          <p className="mt-1 text-sm text-redup">
            Akun demo dengan data fiktif untuk juri dan pengunjung. Pilih peran untuk langsung masuk.
          </p>
          <div className="mt-4 divide-y divide-garis border-y border-garis">
            {AKUN_DEMO.map((a) => (
              <TombolDemo key={a.peran} peran={a.peran} judul={NAMA_PERAN[a.peran]} keterangan={`${a.nama} · ${a.keterangan}`} />
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-redup">
            Atau masuk manual dengan kata sandi <code className="font-semibold text-tinta">{PASSWORD_DEMO}</code> dan
            salah satu email: {AKUN_DEMO.map((a) => a.email).join(", ")}.
          </p>
        </div>
      </section>
    </main>
  );
}
