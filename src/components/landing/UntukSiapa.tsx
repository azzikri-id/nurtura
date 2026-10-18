const PERAN = [
  {
    nama: "Kader posyandu",
    ringkas: "Pencatatan yang cepat dan tidak membingungkan, walau sinyal sedang lemah.",
    poin: ["Input satu anak dalam hitungan detik", "Peringatan bila data tidak wajar", "Daftar anak yang perlu dikunjungi"],
  },
  {
    nama: "Orang tua",
    ringkas: "Memahami kondisi anak tanpa istilah medis yang membingungkan.",
    poin: ["Grafik pertumbuhan anak sendiri", "Asisten gizi bersumber Buku KIA", "Menu MPASI dari bahan yang ada di rumah"],
  },
  {
    nama: "Bidan & puskesmas",
    ringkas: "Melihat seluruh posyandu binaan tanpa menunggu rekap kertas.",
    poin: ["Rekap semua posyandu dalam satu dasbor", "Daftar anak berisiko yang bisa diurutkan", "Catatan tindak lanjut tiap peringatan"],
  },
];

export function UntukSiapa() {
  return (
    <section id="untuk-siapa" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-20 lg:py-28">
      <h2 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">Dibuat untuk tiga peran yang saling terhubung</h2>
      <div className="mt-12 divide-y divide-garis border-y border-garis">
        {PERAN.map((p) => (
          <div key={p.nama} className="grid gap-4 py-8 md:grid-cols-[14rem_1fr_1fr] md:gap-10">
            <h3 className="text-xl font-bold text-tinta">{p.nama}</h3>
            <p className="text-redup">{p.ringkas}</p>
            <ul className="space-y-2 text-sm text-tinta">
              {p.poin.map((poin) => (
                <li key={poin} className="flex gap-3">
                  <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0 text-langit">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {poin}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
