<p align="center">
  <img src="public/brand/nurtura-logo-horizontal.svg" alt="Nurtura" width="280">
</p>

<p align="center"><b>Dampingi tumbuh kembang anak, dari posyandu ke rumah.</b></p>

Nurtura adalah platform web yang menghubungkan **kader posyandu**, **orang tua**, dan **bidan/puskesmas**
untuk mendeteksi risiko stunting lebih awal. Status gizi anak dihitung otomatis dengan standar
antropometri WHO (Permenkes No. 2 Tahun 2020), dan orang tua mendapat panduan gizi serta menu MPASI.

Karya untuk **Web Development Competition UINIC 8.0** — subtema Kesehatan.

**Demo:** https://nurtura.sbs (cadangan: https://nurtura-app.vercel.app)

### Akun demo (data fiktif)
Buka https://nurtura.sbs/masuk lalu pilih peran, atau masuk manual dengan kata sandi `NurturaDemo2026`:

| Peran | Email | Yang bisa dicoba |
|---|---|---|
| Kader posyandu | kader.mawar@example.com | Daftar anak, catat penimbangan, cek data tidak wajar, peringatan otomatis |
| Bidan | bidan@example.com | Rekap per posyandu, antrean peringatan, catatan tindak lanjut |
| Orang tua | orangtua@example.com | Status gizi anak dengan bahasa awam dan grafik pertumbuhan |

Data demo bisa dikembalikan ke kondisi awal dengan `npm run seed`.

## Dokumentasi
| Dokumen | Isi |
|---|---|
| [Panduan penggunaan](docs/panduan-penggunaan.md) | Langkah pemakaian untuk kader, bidan, orang tua, dan admin, dengan tangkapan layar |
| [Dokumentasi API](docs/api.md) | Endpoint `/api/v1`, format request/response, kode galat |
| [Arsitektur & struktur kode](docs/arsitektur.md) | Diagram sistem, struktur folder, basis data, RLS, alur utama, keamanan |

## Fitur
- Pencatatan pengukuran oleh kader dan status gizi otomatis (BB/U, PB/U–TB/U, BB/PB–BB/TB) dengan metode LMS WHO
- Grafik pertumbuhan dengan garis referensi WHO dan skala z yang mudah dibaca
- Peringatan dini (2T, pertumbuhan melambat, status berisiko) dan deteksi kesalahan input
- Dasbor bidan/puskesmas: rekap per posyandu, tren 6 bulan, antrean tindak lanjut
- Asisten gizi berbasis sumber (Buku KIA, pedoman WHO) dengan rujukan dan deteksi tanda bahaya
- Rekomendasi menu MPASI dari bahan lokal, divalidasi aturan keamanan sebelum tampil
- Hak akses per peran dengan Row Level Security, enkripsi NIK, unduh/hapus data (UU PDP)

## Teknologi
Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, RLS) · Claude API (Sonnet 5.5) ·
Zod · Recharts · Vitest · Vercel

## Menjalankan secara lokal

Prasyarat: Node.js 20+, akun [Supabase](https://supabase.com) (gratis), dan API key [Claude](https://console.anthropic.com)
(hanya untuk fitur AI).

1. **Pasang dependensi**
   ```bash
   npm install
   cp .env.example .env.local
   ```
2. **Isi `.env.local`**

   | Variabel | Asal |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key (rahasia, hanya server) |
   | `ANTHROPIC_API_KEY` | Claude Console → API Keys |
   | `NIK_ENCRYPTION_KEY` | Buat sendiri: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

3. **Buat skema database.** Buka Supabase → SQL Editor, lalu jalankan isi berkas
   `supabase/migrations/20261018120000_skema_awal.sql`.
4. **Isi data demo** (wilayah, posyandu, 5 akun demo, 13 anak, basis pengetahuan, bahan pangan):
   ```bash
   npm run seed
   ```
5. **Jalankan**
   ```bash
   npm run dev        # http://localhost:3000
   ```
   Untuk mode produksi: `npm run build && npm start`.

## Pengujian
```bash
npm test          # 54 unit test: z-score terhadap tabel SD resmi WHO, peringatan, validator menu, privasi, enkripsi
npm run test:db   # 29 uji migration + hak akses per peran (Row Level Security) di PostgreSQL
npm run lint
```

## Struktur singkat
| Folder | Isi |
|---|---|
| `src/app` | Halaman per peran dan REST API `/api/v1` |
| `src/lib/gizi` | Perhitungan z-score LMS WHO, kategori Permenkes, peringatan, validator menu |
| `src/lib/ai` | Integrasi Claude, penyamaran data pribadi, deteksi tanda bahaya |
| `supabase/migrations` | Skema database dan aturan akses per peran |
| `scripts` | Seed data demo dan basis pengetahuan |

Rincian ada di [docs/arsitektur.md](docs/arsitektur.md).

## Sumber data
- Tabel LMS dari [WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards) (expanded tables, who.int)
- Kategori status gizi: Permenkes RI No. 2 Tahun 2020 tentang Standar Antropometri Anak
- Basis pengetahuan asisten gizi: ringkasan tim dari materi Buku KIA Kemenkes dan pedoman WHO tentang makanan pendamping

Seluruh data anak pada demo adalah fiktif.
