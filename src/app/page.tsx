import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Masalah } from "@/components/landing/Masalah";
import { CaraKerja } from "@/components/landing/CaraKerja";
import { CobaHitung } from "@/components/landing/CobaHitung";
import { UntukSiapa } from "@/components/landing/UntukSiapa";
import { Privasi } from "@/components/landing/Privasi";
import { Footer } from "@/components/landing/Footer";
import { CONTOH_PENGUKURAN } from "@/components/landing/contoh";
import { hitungStatusGizi } from "@/lib/gizi";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Masalah />
        <CaraKerja />
        <section id="coba" className="scroll-mt-16 bg-latar">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">Coba hitung status gizi anak</h2>
              <p className="mt-4 text-redup">
                Perhitungan ini sama dengan yang dipakai kader di Nurtura: z-score dari tabel resmi WHO,
                dengan koreksi cara ukur dan kategori Permenkes No. 2 Tahun 2020.
              </p>
            </div>
            <div className="mt-10">
              <CobaHitung hasilAwal={hitungStatusGizi(CONTOH_PENGUKURAN)} />
            </div>
          </div>
        </section>
        <UntukSiapa />
        <Privasi />
      </main>
      <Footer />
    </>
  );
}
