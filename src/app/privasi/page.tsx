import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = { title: "Kebijakan privasi" };

const BAGIAN: { judul: string; isi: string[] }[] = [
  {
    judul: "Data yang dicatat",
    isi: [
      "Data anak: nama, tanggal lahir, jenis kelamin, dan NIK bila diberikan (opsional).",
      "Data keluarga: nama ibu, nama ayah (opsional), dan alamat singkat (opsional).",
      "Hasil penimbangan: tanggal, berat, panjang/tinggi badan, cara ukur, lingkar kepala, serta status gizi yang dihitung otomatis.",
      "Pertanyaan ke asisten gizi dan menu yang diminta, setelah identitas dihapus.",
    ],
  },
  {
    judul: "Untuk apa data dipakai",
    isi: [
      "Memantau tumbuh kembang anak dan mendeteksi risiko gizi lebih awal.",
      "Memberi tahu bidan wilayah bila pertumbuhan anak perlu ditindaklanjuti.",
      "Membantu orang tua memahami kondisi anak dan memberi saran makan.",
      "Data tidak dijual dan tidak dipakai untuk iklan.",
    ],
  },
  {
    judul: "Siapa yang bisa melihat",
    isi: [
      "Kader posyandu: hanya anak di posyandu tempat ia bertugas.",
      "Bidan/puskesmas: hanya anak di posyandu binaannya.",
      "Orang tua: hanya anaknya sendiri, setelah menautkan akun dengan kode undangan dari kader.",
      "Admin sistem mengelola wilayah dan akun, tetapi tidak dapat melihat data kesehatan anak.",
      "Batasan ini dijaga langsung di database (Row Level Security), bukan hanya di tampilan.",
    ],
  },
  {
    judul: "Bagaimana data dilindungi",
    isi: [
      "Seluruh koneksi terenkripsi (HTTPS). NIK disimpan terenkripsi (AES-256-GCM), tidak pernah dalam bentuk asli.",
      "Data hanya disimpan setelah orang tua memberi persetujuan, dan persetujuan itu dicatat beserta waktunya.",
      "Penambahan dan perubahan data anak tercatat di log audit sehingga dapat ditelusuri.",
    ],
  },
  {
    judul: "Asisten gizi berbasis AI",
    isi: [
      "Asisten memakai layanan Claude dari Anthropic. Yang dikirim hanya pertanyaan yang sudah dibersihkan dari nama, NIK, nomor HP, dan email, serta umur, jenis kelamin, dan status gizi anak.",
      "Jawaban disusun dari pedoman gizi yang tersimpan di Nurtura dan bukan pengganti konsultasi tenaga kesehatan.",
      "Pertanyaan yang menyebut tanda bahaya tidak dikirim ke AI; Anda langsung diarahkan ke fasilitas kesehatan.",
    ],
  },
  {
    judul: "Hak orang tua",
    isi: [
      "Melihat seluruh data anak di halaman orang tua.",
      "Mengunduh salinan data anak dalam format JSON.",
      "Meminta perbaikan data melalui kader posyandu.",
      "Menghapus data anak dan keluarga dari Nurtura kapan saja; penghapusan bersifat permanen.",
    ],
  },
];

export default function HalamanPrivasi() {
  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/" aria-label="Kembali ke beranda Nurtura">
          <Image src="/brand/nurtura-logo-horizontal.svg" alt="Nurtura" width={132} height={33} />
        </Link>
        <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-tinta">Kebijakan privasi</h1>
        <p className="mt-3 text-redup">
          Data kesehatan anak termasuk data pribadi yang bersifat spesifik menurut Undang-Undang Nomor 27 Tahun 2022
          tentang Pelindungan Data Pribadi. Halaman ini menjelaskan data apa yang dicatat Nurtura, untuk apa, siapa yang
          dapat melihatnya, dan hak Anda sebagai orang tua.
        </p>
        <div className="mt-10 space-y-10">
          {BAGIAN.map((b) => (
            <section key={b.judul}>
              <h2 className="text-lg font-bold text-tinta">{b.judul}</h2>
              <ul className="mt-3 space-y-2 text-tinta/90">
                {b.isi.map((i) => (
                  <li key={i} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-langit" />
                    {i}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-12 border-t border-garis pt-6 text-sm text-redup">
          Pertanyaan tentang data Anda dapat disampaikan kepada kader posyandu atau puskesmas setempat.
          Versi kebijakan: Oktober 2026.
        </p>
      </div>
    </main>
  );
}
