# Dokumentasi API

Semua endpoint berada di bawah `/api/v1` dan menerima atau mengembalikan JSON (UTF-8).

- **Basis URL produksi:** `https://nurtura.sbs/api/v1`
- **Autentikasi:** cookie sesi Supabase (HttpOnly) yang dibuat saat masuk lewat `/masuk`. Endpoint bertanda 🔒 menolak
  permintaan tanpa sesi dengan `401`.
- **Hak akses data:** dijaga di database dengan Row Level Security. Bila pengguna tidak berhak atas anak yang
  diminta, respons yang dikirim adalah `404`, bukan `403`, supaya keberadaan data anak tidak bocor.

## Format respons

Berhasil:

```json
{ "data": { ... } }
```

Gagal:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Data pengukuran tidak valid", "fields": { "beratKg": "Isi berat badan" } } }
```

`fields` hanya muncul pada galat validasi yang menyangkut beberapa kolom.

| HTTP | `code` | Arti |
|---|---|---|
| 400 | `INVALID_JSON`, `VALIDATION_ERROR` | Body bukan JSON atau isinya tidak valid |
| 401 | `UNAUTHORIZED` | Belum masuk |
| 404 | `NOT_FOUND` | Data anak tidak ada atau bukan hak pengguna |
| 429 | `RATE_LIMITED` | Batas pemakaian AI per jam tercapai |
| 502 | `AI_ERROR` | Layanan AI gagal atau menolak menjawab |
| 503 | `AI_ERROR` | Layanan AI sedang sibuk; coba lagi |

---

## POST `/status-gizi`

Menghitung status gizi dari satu pengukuran memakai standar antropometri WHO dan kategori Permenkes No. 2 Tahun 2020.
Endpoint ini **publik** dan **tidak menyimpan data**. Kalkulator di halaman depan memakai endpoint ini.

**Body**

| Kolom | Tipe | Aturan |
|---|---|---|
| `tglLahir` | string | `YYYY-MM-DD` |
| `tglUkur` | string | `YYYY-MM-DD`, umur pada tanggal ukur 0–60 bulan |
| `jenisKelamin` | `"L"` \| `"P"` | |
| `beratKg` | number | 0,5–40 |
| `tinggiCm` | number | 35–130 |
| `caraUkur` | `"terlentang"` \| `"berdiri"` | Angka dikoreksi ±0,7 cm bila cara ukur tidak sesuai umur |

**Contoh**

```bash
curl -X POST https://nurtura.sbs/api/v1/status-gizi \
  -H "Content-Type: application/json" \
  -d '{"tglLahir":"2025-08-18","tglUkur":"2026-10-18","jenisKelamin":"L","beratKg":9.1,"tinggiCm":73.5,"caraUkur":"terlentang"}'
```

```json
{
  "data": {
    "umurHari": 426,
    "umurBulan": 14,
    "tinggiTerkoreksiCm": 73.5,
    "bbu":  { "z": -0.94, "kategori": { "label": "Berat badan normal", "tingkat": "normal", "penjelasan": "Berat badan anak sesuai dengan anak seusianya. Tetap timbang setiap bulan." } },
    "tbu":  { "z": -1.83, "kategori": { "label": "Normal", "tingkat": "normal", "penjelasan": "Tinggi badan anak sesuai standar seusianya." } },
    "bbtb": { "z": -0.12, "kategori": { "label": "Gizi baik (normal)", "tingkat": "normal", "penjelasan": "Berat badan anak seimbang dengan tinggi badannya." } }
  }
}
```

- `bbu`: berat badan menurut umur.
- `tbu`: panjang atau tinggi badan menurut umur.
- `bbtb`: berat badan menurut panjang atau tinggi badan.
- Indikator di luar cakupan tabel WHO bernilai `null`.
- Nilai `tingkat` adalah salah satu dari `normal`, `perhatian`, `waspada`, atau `bahaya`.

**Contoh galat (400)**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Data pengukuran tidak valid",
  "fields": { "jenisKelamin": "Pilih jenis kelamin", "tinggiCm": "Isi panjang/tinggi badan", "caraUkur": "Pilih cara ukur" } } }
```

---

## POST `/ai/tanya` 🔒

Asisten gizi untuk orang tua. Jawaban hanya disusun dari basis pengetahuan Nurtura dan disesuaikan dengan umur serta
status gizi anak.

**Body**

| Kolom | Tipe | Aturan |
|---|---|---|
| `anakId` | string (UUID) | Anak yang boleh diakses pengguna |
| `pertanyaan` | string | 3–500 karakter |

**Alur di server**

1. Periksa sesi dan validasi body.
2. Ambil profil anak tanpa identitas (umur dan status gizi). RLS menjamin anak tersebut milik pengguna.
3. Periksa batas pemakaian: **30 pertanyaan per jam per akun**.
4. Samarkan NIK, email, nomor HP, dan nama yang dikenal dalam pertanyaan.
5. Bila ada **tanda bahaya** (kejang, sesak napas, tidak bisa minum, dll.), langsung kirim pesan untuk segera ke
   fasilitas kesehatan tanpa memanggil AI.
6. Cari hingga 5 potongan sumber (full-text search PostgreSQL dengan filter umur). Bila tidak ada sumber yang cocok,
   jawab bahwa topiknya belum tercakup.
7. Minta Claude menjawab hanya dari sumber, dengan nomor rujukan `[n]`.
8. Simpan pertanyaan (yang sudah disamarkan) dan jawaban ke tabel `percakapan_ai`.

**Respons**

```json
{
  "data": {
    "jawaban": "Telur dan tempe adalah lauk murah yang kaya protein [1]. ...",
    "bahaya": false,
    "sumber": [ { "nomor": 1, "topik": "Protein hewani murah", "sumber": "Ringkasan tim dari materi Buku KIA Kemenkes" } ]
  }
}
```

`sumber` hanya berisi rujukan yang benar-benar dipakai dalam jawaban. Bila `bahaya` bernilai `true`, `jawaban` berisi
arahan ke fasilitas kesehatan.

---

## POST `/ai/menu` 🔒

Menyusun menu MPASI atau makan anak untuk satu hari dari bahan pilihan orang tua.

**Body**

| Kolom | Tipe | Aturan |
|---|---|---|
| `anakId` | string (UUID) | |
| `bahan` | string[] | 1–15 nama bahan dari tabel `bahan_pangan` |
| `budget` | integer, opsional | Rupiah per hari, 1.000–200.000 |

**Alur di server**

1. Anak di bawah 6 bulan tidak dibuatkan menu. Respons berisi `menu: []` dan catatan untuk memberikan ASI saja.
2. Periksa batas pemakaian: **15 permintaan per jam per akun**.
3. Claude mengembalikan menu dalam **structured output** yang divalidasi dengan skema Zod.
4. Setiap menu diperiksa oleh validator berbasis aturan (`src/lib/gizi/menu.ts`):
   - tidak ada madu, garam, gula, kecap, atau penyedap untuk anak di bawah 12 bulan;
   - tidak ada makanan berisiko tersedak untuk anak di bawah 3 tahun;
   - tekstur sesuai umur;
   - menu makan utama memakai protein hewani bila anak berisiko gizi.
5. Bila ada menu yang ditolak, Claude diminta memperbaikinya **satu kali**. Menu yang tetap melanggar tidak
   ditampilkan.

**Respons**

```json
{
  "data": {
    "menu": [
      {
        "menu": { "nama": "Bubur hati ayam bayam", "waktu": "pagi", "bahan": [ { "nama": "Hati ayam", "takaran": "30 g" } ],
                  "caraMasak": [ "..." ], "tekstur": "cincang", "alasan": "...", "perkiraanBiaya": 4200 },
        "ditolak": [],
        "catatan": []
      }
    ],
    "disembunyikan": [ { "nama": "Puding madu", "alasan": ["Mengandung madu, tidak boleh untuk anak di bawah 12 bulan (risiko botulisme)."] } ],
    "catatan": "Perkiraan biaya memakai harga pasar rata-rata."
  }
}
```

---

## GET `/anak/{id}/ekspor` 🔒

Mengunduh salinan seluruh data anak. Endpoint ini memenuhi hak akses subjek data menurut UU PDP.

- Hanya pengguna yang berhak atas anak tersebut yang menerima data (dijaga RLS).
- Respons diberi header `Content-Disposition: attachment; filename="nurtura-<nama>.json"` dan
  `Cache-Control: no-store`.
- NIK ditampilkan tersamar (`************1234`), dan sandi NIK tidak ikut diekspor.
- Setiap ekspor dicatat di tabel `audit_log`.

**Isi berkas**

```json
{
  "diekspor_pada": "2026-10-24T08:00:00.000Z",
  "sumber": "Nurtura",
  "anak": {
    "nama": "Budi Santoso", "tgl_lahir": "2025-08-18", "jenis_kelamin": "L", "nik": null,
    "posyandu": { "nama": "Posyandu Mawar" },
    "keluarga": { "nama_ibu": "...", "nama_ayah": "...", "alamat": "...", "persetujuan": [ ... ] },
    "pengukuran": [ { "tgl_ukur": "...", "berat_kg": 9.1, "tinggi_cm": 73.5, "status_gizi": { ... } } ],
    "peringatan": [ ... ],
    "imunisasi": [ ... ]
  }
}
```

---

## Operasi lain (Server Actions)

Formulir di aplikasi tidak memanggil endpoint REST. Formulir memakai **Server Actions** Next.js, yang hanya dapat dipanggil
dari halaman aplikasi dan dilindungi pemeriksaan origin bawaan Next.js:

| Aksi | Berkas | Peran |
|---|---|---|
| Masuk, masuk demo, keluar (batas 5 gagal per 15 menit per email) | `src/app/masuk/actions.ts` | Semua |
| Daftar akun orang tua (batas 10 per jam per IP) | `src/app/daftar/actions.ts` | Publik |
| Ganti kata sandi sendiri | `src/app/akun/actions.ts` | Semua yang masuk |
| Tambah posyandu, buat akun kader/bidan, atur ulang sandi, nonaktifkan akun | `src/app/admin/actions.ts` | Admin |
| Simpan pengukuran (dengan cek kewajaran) | `src/app/kader/anak/[id]/actions.ts` | Kader |
| Daftarkan anak (enkripsi NIK, persetujuan) | `src/app/kader/anak/baru/actions.ts` | Kader |
| Catat tindak lanjut peringatan | `src/app/bidan/actions.ts` | Bidan |
| Tautkan kode undangan, hapus data anak | `src/app/orang-tua/actions.ts` | Orang tua |
