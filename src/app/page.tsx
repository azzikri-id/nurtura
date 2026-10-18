import Image from "next/image";

const peran = [
  {
    nama: "Kader posyandu",
    isi: "Catat berat dan tinggi anak dalam hitungan detik, lalu langsung lihat status gizinya.",
  },
  {
    nama: "Orang tua",
    isi: "Pantau grafik tumbuh kembang anak dan dapatkan saran gizi serta menu MPASI yang terjangkau.",
  },
  {
    nama: "Bidan & puskesmas",
    isi: "Lihat anak berisiko di seluruh posyandu wilayah Anda dan tindak lanjuti lebih awal.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-latar">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-16">
        <Image
          src="/brand/nurtura-logo-horizontal.svg"
          alt="Nurtura"
          width={240}
          height={60}
          priority
        />
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-extrabold leading-tight text-tinta sm:text-5xl">
            Dampingi tumbuh kembang anak, dari posyandu ke rumah.
          </h1>
          <p className="text-lg text-redup">
            Nurtura menghubungkan kader posyandu, orang tua, dan puskesmas dalam satu ekosistem
            untuk mendeteksi risiko stunting lebih awal. Status gizi dihitung otomatis dengan
            standar WHO.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {peran.map((p) => (
            <li key={p.nama} className="rounded-2xl border border-garis bg-white p-5">
              <h2 className="font-bold text-tinta">{p.nama}</h2>
              <p className="mt-2 text-sm text-redup">{p.isi}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-redup">
          Sedang dalam pengembangan untuk Web Development Competition UINIC 8.0.
        </p>
      </section>
    </main>
  );
}
