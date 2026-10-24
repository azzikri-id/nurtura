import { KartuAnakContoh } from "./KartuAnakContoh";

export function Hero() {
  return (
    <section className="border-b border-garis bg-latar">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div>
          <p className="text-sm font-semibold text-langit-tua">Pemantauan tumbuh kembang untuk posyandu</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-tinta sm:text-5xl lg:text-[3.4rem]">
            Setiap timbangan di posyandu jadi langkah nyata di rumah.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-redup">
            Kader mencatat berat dan tinggi anak, Nurtura menghitung status gizinya dengan standar WHO,
            bidan menerima peringatan lebih awal, dan orang tua tahu apa yang perlu dilakukan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#coba"
              className="rounded-lg bg-langit-tua px-5 py-3 font-semibold text-white transition-colors hover:bg-tinta">
              Coba hitung status gizi
            </a>
            <a href="/masuk" className="font-semibold text-tinta underline decoration-langit/40 underline-offset-4 hover:decoration-langit">
              Coba akun demo kader, bidan, atau orang tua
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-garis pt-6 text-sm text-redup">
            <li><span className="font-semibold text-tinta">Standar WHO 2006</span> untuk anak 0–60 bulan</li>
            <li><span className="font-semibold text-tinta">Permenkes No. 2/2020</span> untuk kategori</li>
          </ul>
        </div>
        <KartuAnakContoh />
      </div>
    </section>
  );
}
