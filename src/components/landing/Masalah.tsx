const MASALAH = [
  {
    judul: "Dicatat di kertas",
    isi: "Berat dan tinggi anak ditulis di buku KMS dan register posyandu. Penurunan yang pelan baru terlihat setelah berbulan-bulan.",
  },
  {
    judul: "Terlambat sampai ke bidan",
    isi: "Rekap dikirim ke puskesmas sebulan sekali, sering terlambat, dan formatnya berbeda di tiap posyandu.",
  },
  {
    judul: "Orang tua pulang tanpa arahan",
    isi: "Ibu tahu anaknya “kurang”, tapi tidak tahu menu apa yang cocok untuk umur anak, bahan di rumah, dan uang yang ada.",
  },
];

export function Masalah() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
      <div>
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-tinta sm:text-4xl">
          Data tumbuh kembang anak sering berhenti di buku catatan.
        </h2>
        <p className="mt-4 text-redup">
          Posyandu adalah garda terdepan pencegahan stunting, tapi alur datanya masih terputus di tiga titik.
        </p>
      </div>
      <ol className="divide-y divide-garis border-y border-garis">
        {MASALAH.map((m, i) => (
          <li key={m.judul} className="grid grid-cols-[3rem_1fr] gap-4 py-6">
            <span className="text-sm font-bold tabular-nums text-langit-tua">0{i + 1}</span>
            <div>
              <h3 className="font-bold text-tinta">{m.judul}</h3>
              <p className="mt-1 text-redup">{m.isi}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
