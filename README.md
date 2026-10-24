<p align="center">
  <img src="public/brand/nurtura-logo-horizontal.svg" alt="Nurtura" width="280">
</p>

<p align="center"><b>Dampingi tumbuh kembang anak, dari posyandu ke rumah.</b></p>

Nurtura adalah platform web yang menghubungkan **kader posyandu**, **orang tua**, dan **bidan/puskesmas**
untuk mendeteksi risiko stunting lebih awal. Status gizi anak dihitung otomatis dengan standar
antropometri WHO (Permenkes No. 2 Tahun 2020), dan orang tua mendapat panduan gizi serta menu MPASI.

Karya untuk **Web Development Competition UINIC 8.0** — subtema Kesehatan.

**Demo:** https://nurtura-app.vercel.app

### Akun demo (data fiktif)
Buka https://nurtura-app.vercel.app/masuk lalu pilih peran, atau masuk manual dengan kata sandi `NurturaDemo2026`:

| Peran | Email | Yang bisa dicoba |
|---|---|---|
| Kader posyandu | kader.mawar@example.com | Daftar anak, catat penimbangan, cek data tidak wajar, peringatan otomatis |
| Bidan | bidan@example.com | Rekap per posyandu, antrean peringatan, catatan tindak lanjut |
| Orang tua | orangtua@example.com | Status gizi anak dengan bahasa awam dan grafik pertumbuhan |

Data demo bisa dikembalikan ke kondisi awal dengan `npm run seed`.

> Status: dalam pengembangan. Dokumentasi lengkap, akun demo, dan panduan penggunaan akan dilengkapi.

## Fitur
- Pencatatan pengukuran oleh kader dan status gizi otomatis (BB/U, PB/U–TB/U, BB/PB–BB/TB)
- Grafik pertumbuhan dengan garis referensi WHO
- Peringatan dini saat pertumbuhan melambat dan deteksi kesalahan input
- Dasbor bidan/puskesmas per wilayah
- Asisten gizi berbasis Buku KIA dan rekomendasi menu MPASI lokal (AI, dengan sumber dan validasi keamanan)
- Hak akses per peran dengan Row Level Security dan perlindungan data anak (UU PDP)

## Teknologi
Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, RLS) · Zod · Recharts · Vitest · Vercel

## Menjalankan secara lokal
```bash
npm install
cp .env.example .env.local   # isi nilai Supabase & API key
npm run dev                  # http://localhost:3000
```

## Pengujian
```bash
npm test          # unit test z-score terhadap tabel SD resmi WHO
npm run test:db   # migration + uji hak akses per peran (Row Level Security) di PostgreSQL
```

## Struktur
| Folder | Isi |
|---|---|
| `src/lib/gizi` | Perhitungan z-score LMS WHO, kategori Permenkes, data referensi WHO |
| `supabase/migrations` | Skema database dan aturan akses per peran |
| `supabase/tests` | Uji migration dan Row Level Security |

## Sumber data
Tabel LMS dari [WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards) (expanded tables, who.int).
