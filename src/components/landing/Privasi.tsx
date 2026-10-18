const JANJI = [
  {
    judul: "Hanya yang berhak bisa melihat",
    isi: "Kader hanya melihat anak di posyandunya, bidan hanya wilayahnya, orang tua hanya anaknya sendiri. Aturan ini dijaga langsung di database.",
  },
  {
    judul: "Dengan persetujuan orang tua",
    isi: "Data anak baru disimpan setelah orang tua setuju. Orang tua bisa mengunduh data anaknya atau meminta penghapusan.",
  },
  {
    judul: "AI tanpa identitas",
    isi: "Asisten gizi hanya menerima umur, jenis kelamin, dan status gizi. Nama, NIK, dan alamat tidak pernah dikirim.",
  },
  {
    judul: "Tercatat dan bisa diaudit",
    isi: "Setiap akses ke data anak dicatat, sehingga penyalahgunaan bisa ditelusuri.",
  },
];

export function Privasi() {
  return (
    <section id="privasi" className="scroll-mt-16 bg-tinta text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
        <div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Data anak bukan untuk dibagikan.</h2>
          <p className="mt-4 text-white/75">
            Data kesehatan anak termasuk data pribadi spesifik menurut UU No. 27 Tahun 2022 tentang Pelindungan
            Data Pribadi. Karena itu batasannya kami pasang sejak awal, bukan belakangan.
          </p>
        </div>
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {JANJI.map((j) => (
            <div key={j.judul} className="border-t border-white/20 pt-4">
              <dt className="font-bold">{j.judul}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-white/75">{j.isi}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
