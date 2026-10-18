const LANGKAH = [
  {
    siapa: "Kader",
    judul: "Timbang dan ukur",
    isi: "Masukkan berat dan panjang badan lewat HP. Sistem mengingatkan bila angkanya tidak masuk akal.",
  },
  {
    siapa: "Nurtura",
    judul: "Hitung status gizi",
    isi: "Z-score BB/U, TB/U, dan BB/TB dihitung dari tabel resmi WHO, lalu dikategorikan sesuai Permenkes.",
  },
  {
    siapa: "Bidan",
    judul: "Tindak lanjuti lebih awal",
    isi: "Anak yang pertumbuhannya melambat muncul di dasbor puskesmas sebelum masuk kategori stunting.",
  },
  {
    siapa: "Orang tua",
    judul: "Tahu harus berbuat apa",
    isi: "Grafik anak dengan bahasa sederhana, asisten gizi bersumber Buku KIA, dan menu MPASI dari bahan di rumah.",
  },
];

export function CaraKerja() {
  return (
    <section id="cara-kerja" className="scroll-mt-16 border-y border-garis bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">Satu pengukuran, empat pihak bergerak</h2>
          <p className="mt-4 text-redup">
            Data yang dicatat kader di posyandu langsung sampai ke bidan dan orang tua, tanpa menunggu rekap akhir bulan.
          </p>
        </div>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          <span aria-hidden className="absolute left-0 right-0 top-4 hidden h-px bg-garis md:block" />
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="relative">
              <span className={`relative grid size-8 place-items-center rounded-full text-sm font-bold ring-4 ring-white ${
                i === 1 ? "bg-langit text-white" : "bg-latar text-tinta"}`}>
                {i + 1}
              </span>
              <p className="mt-5 text-xs font-semibold tracking-wide text-langit-tua">{l.siapa}</p>
              <h3 className="mt-1 text-lg font-bold text-tinta">{l.judul}</h3>
              <p className="mt-2 text-sm leading-relaxed text-redup">{l.isi}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
