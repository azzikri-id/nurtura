# Arsitektur dan Struktur Kode

## Gambaran umum

```
 Kader (HP)        Bidan (laptop)       Orang tua (HP)
     │                   │                    │
     └───────────── HTTPS (Vercel) ───────────┘
                         │
              Next.js 16 (App Router)
   ┌─────────────────────┼──────────────────────────┐
   │ Halaman (Server Components + PPR)              │
   │ Server Actions: simpan pengukuran, daftar anak │
   │ API /api/v1: status-gizi, ai/tanya, ai/menu,   │
   │              anak/{id}/ekspor                  │
   │ src/lib/gizi: z-score WHO, peringatan, validasi│
   └──────────┬───────────────────────────┬─────────┘
              │ cookie sesi (RLS)         │ teks tanpa identitas
              ▼                           ▼
   Supabase (PostgreSQL + Auth)      Claude API
   - 17 tabel, Row Level Security    (claude-sonnet-5-5)
   - fungsi cari_pengetahuan (FTS)
```

Prinsip yang dipegang:

1. **Perhitungan medis tidak memakai AI.** Z-score, kategori gizi, peringatan dini, dan cek kewajaran data dihitung oleh
   kode deterministik di `src/lib/gizi`. Kode ini diuji terhadap 616 nilai dari tabel SD resmi WHO.
2. **AI hanya membantu orang tua.** Jawabannya dibatasi oleh basis pengetahuan dan diperiksa oleh aturan sebelum tampil.
3. **Hak akses dijaga di database.** Walaupun kode aplikasi keliru, Row Level Security tetap mencegah satu peran
   membaca data milik peran lain.

## Struktur folder

```
nurtura/
├── src/
│   ├── app/                      # Rute (App Router)
│   │   ├── page.tsx              # Landing + kalkulator status gizi
│   │   ├── masuk/                # Login, login demo, logout (Server Actions)
│   │   ├── kader/                # Daftar anak, detail + catat pengukuran, daftar anak baru
│   │   ├── bidan/                # Rekap wilayah, tren 6 bulan, antrean peringatan
│   │   ├── orang-tua/            # Status gizi, asisten gizi, menu MPASI, data & privasi
│   │   ├── admin/                # Ringkasan akun dan posyandu
│   │   ├── privasi/              # Kebijakan privasi
│   │   └── api/v1/               # REST API (lihat docs/api.md)
│   ├── components/
│   │   ├── SkalaZ.tsx            # Penggaris z-score dengan zona warna
│   │   ├── app/                  # Bilah atas, indikator memuat
│   │   ├── landing/              # Bagian-bagian halaman depan + grafik WHO
│   │   └── orang-tua/            # AsistenGizi, MenuMpasi, DataPrivasi
│   ├── lib/
│   │   ├── gizi/                 # Inti perhitungan
│   │   │   ├── zscore.ts         # Metode LMS WHO, koreksi ±0,7 cm, z terbatas di luar ±3 SD
│   │   │   ├── kategori.ts       # Kategori Permenkes No. 2/2020 + penjelasan awam
│   │   │   ├── peringatan.ts     # KBM, peringatan dini, cek kewajaran input
│   │   │   ├── menu.ts           # Skema menu AI + validator keamanan MPASI
│   │   │   └── data/             # Tabel LMS WHO (wfa, lhfa, wfl, wfh)
│   │   ├── ai/
│   │   │   ├── claude.ts         # Klien Claude, model, fallback, penerjemah galat
│   │   │   ├── konteks.ts        # Profil anak tanpa identitas, batas pemakaian
│   │   │   └── privasi.ts        # Penyamaran data pribadi, deteksi tanda bahaya
│   │   ├── supabase/server.ts    # Klien Supabase (sesi pengguna dan service role)
│   │   ├── auth.ts               # Pengguna aktif, wajibPeran, beranda per peran
│   │   ├── enkripsi.ts           # AES-256-GCM untuk NIK
│   │   ├── data/kader.ts         # Kueri data anak dan pengukuran
│   │   └── format.ts             # Format tanggal, umur, angka (id-ID, WIB)
│   └── proxy.ts                  # Penyegaran sesi + proteksi rute per peran
├── supabase/
│   ├── migrations/               # Skema, fungsi, dan kebijakan RLS
│   └── tests/rls-check.mjs       # 29 uji hak akses di PostgreSQL (PGlite)
├── scripts/
│   ├── seed.ts                   # Data demo (wilayah, akun, 13 anak, 96 pengukuran)
│   └── data/                     # Basis pengetahuan (25 topik) dan 29 bahan pangan
└── docs/                         # Dokumentasi ini
```

## Basis data

Ada 17 tabel di skema `public`:

| Kelompok | Tabel |
|---|---|
| Wilayah & layanan | `wilayah`, `puskesmas`, `posyandu`, `kader_posyandu` |
| Pengguna | `profiles` (peran: admin, bidan, kader, orang_tua) |
| Anak | `keluarga`, `anak`, `persetujuan`, `pengukuran`, `status_gizi`, `peringatan`, `imunisasi` |
| AI | `pengetahuan`, `bahan_pangan`, `percakapan_ai`, `rekomendasi_menu` |
| Jejak audit | `audit_log` |

Ringkasan aturan Row Level Security:

| Peran | Bisa membaca | Bisa menulis |
|---|---|---|
| Kader | Anak di posyandu tempat ia bertugas | Anak baru, pengukuran, status gizi, peringatan di posyandunya |
| Bidan | Anak di semua posyandu wilayah puskesmasnya | Tindak lanjut peringatan |
| Orang tua | Anak yang sudah ditautkan dengan kode undangan | Percakapan AI dan rekomendasi menu miliknya |
| Admin | Wilayah, posyandu, dan akun, **tanpa** data kesehatan anak | Pengelolaan wilayah dan akun |

Fungsi pembantu kebijakan, misalnya `peran_saya()` dan `boleh_baca_anak()`, disimpan di skema `private` agar tidak
bisa dipanggil lewat API. Peran pengguna baru selalu `orang_tua`. Peran lain hanya bisa diberikan oleh tim.

## Alur utama

### Pencatatan penimbangan (kader)

1. Formulir mengirim data ke Server Action `simpanPengukuran`.
2. Action memvalidasi data dengan Zod dan memastikan pengguna berperan kader.
3. `cekKewajaran()` membandingkan data dengan pengukuran sebelumnya. Bila janggal, kader diminta mengonfirmasi dan
   menulis alasan.
4. `hitungStatusGizi()` menghitung tiga z-score WHO, lalu hasilnya disimpan ke `pengukuran` dan `status_gizi`.
5. `cekPeringatan()` memeriksa riwayat untuk tiga kondisi: dua kali berturut-turut tidak naik (2T), z turun lebih dari
   0,5 SD, atau kategori berisiko. Peringatan baru masuk ke antrean bidan.
6. Seluruh langkah ini dicatat di `audit_log`.

### Asisten gizi (orang tua)

Pertanyaan diproses dalam urutan berikut:

1. Disamarkan (redaksi).
2. Diperiksa tanda bahaya.
3. Dicarikan sumber dengan full-text search berbahasa Indonesia dan filter umur.
4. Dijawab oleh Claude hanya dari sumber, dengan rujukan.
5. Disimpan.

Claude **tidak pernah** menerima nama, NIK, atau alamat anak. Claude hanya menerima umur dan status gizi.

### Menu MPASI (orang tua)

Bahan pilihan dan profil anak dikirim ke Claude, yang mengembalikan menu dalam structured output (skema Zod). Validator
aturan di `menu.ts` lalu menolak menu yang tidak aman. Claude diberi umpan balik untuk memperbaikinya sekali. Menu yang
tetap melanggar disembunyikan, dan alasannya ditampilkan kepada orang tua.

## Keamanan dan privasi

| Lapisan | Penerapan |
|---|---|
| Autentikasi | Supabase Auth. Cookie sesi bersifat HttpOnly, SameSite=Lax, dan Secure di produksi. `proxy.ts` melindungi `/kader`, `/bidan`, `/orang-tua`, dan `/admin`. Login dibatasi 5 kali gagal per 15 menit per email (dicatat di `audit_log` sebagai hash, bukan email asli). Tombol akun demo dikecualikan agar tidak bisa dikunci orang lain. |
| Otorisasi | `wajibPeran()` di setiap halaman dan aksi, ditambah Row Level Security di setiap tabel |
| Validasi | Zod di setiap API dan Server Action, dengan batas angka yang masuk akal secara medis |
| Data sensitif | NIK dienkripsi AES-256-GCM (kunci hanya di server) dan ditampilkan tersamar. Kunci service role tidak pernah dikirim ke browser. |
| AI | Data pribadi disamarkan. Pertanyaan dibungkus `<pertanyaan>` sebagai pengaman prompt injection. Ada batas 30 dan 15 permintaan per jam, serta deteksi tanda bahaya tanpa AI. |
| Header HTTP | Content-Security-Policy, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, dan Permissions-Policy. Header `X-Powered-By` dimatikan. |
| Hak subjek data (UU PDP) | Persetujuan tercatat beserta versi kebijakan. Orang tua bisa mengunduh dan menghapus data. Ekspor dan perubahan data dicatat di `audit_log`. |

## Pengujian

| Perintah | Isi |
|---|---|
| `npm test` | 54 unit test (Vitest): z-score terhadap 616 nilai tabel SD WHO, kategori, peringatan, validator menu, penyamaran privasi, enkripsi |
| `npm run test:db` | 29 uji migration dan RLS di PostgreSQL (PGlite): tiap peran hanya bisa membaca dan menulis datanya sendiri |
| `npm run lint` | ESLint (aturan Next.js + React) |

Audit Lighthouse (mode mobile, 24 Okt 2026) untuk 8 halaman utama: aksesibilitas 100, best practices 100, SEO 100, performa 97–100.
