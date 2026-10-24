/**
 * Mengisi Supabase dengan data contoh (fiktif) dan akun demo untuk juri.
 * Aman dijalankan ulang: data demo lama dihapus dulu.  Jalankan: npm run seed
 *
 * Berat dan tinggi anak dibangkitkan dari kurva WHO (z-score target per anak), lalu status gizi
 * dan peringatannya dihitung dengan modul yang sama dengan aplikasi.
 */
import { createClient } from "@supabase/supabase-js";
import {
  cekPeringatan,
  hitungStatusGizi,
  nilaiUntukZ,
  type JenisKelamin,
  type StatusGizi,
  type Titik,
} from "../src/lib/gizi";
import { AKUN_DEMO, PASSWORD_DEMO } from "../src/lib/demo";
import { CONTOH_BERAT_BULANAN } from "../src/components/landing/contoh";
import { PENGETAHUAN } from "./data/pengetahuan";
import { BAHAN } from "./data/bahan";

process.loadEnvFile(".env.local");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const KABUPATEN = "Kabupaten Harapan";
const AKUN = [
  ...AKUN_DEMO,
  { peran: "kader" as const, email: "kader.melati@example.com", nama: "Dewi Kartika", keterangan: "Posyandu Melati" },
  { peran: "admin" as const, email: "admin@example.com", nama: "Admin Nurtura", keterangan: "" },
];

function cek<T>(hasil: { data: T; error: { message: string } | null }, langkah: string): NonNullable<T> {
  if (hasil.error) throw new Error(`${langkah}: ${hasil.error.message}`);
  return hasil.data as NonNullable<T>;
}

// --------------------------------------------------------------------------------------------
// Bersihkan data demo lama
// --------------------------------------------------------------------------------------------
async function bersihkan() {
  const emailDemo = new Set(AKUN.map((a) => a.email));
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) if (u.email && emailDemo.has(u.email)) await db.auth.admin.deleteUser(u.id);

  const kab = (await db.from("wilayah").select("id").eq("nama", KABUPATEN)).data ?? [];
  if (!kab.length) return;
  const kec = (await db.from("wilayah").select("id").in("induk_id", kab.map((w) => w.id))).data ?? [];
  const desa = (await db.from("wilayah").select("id").in("induk_id", kec.map((w) => w.id))).data ?? [];
  const semuaWilayah = [...kab, ...kec, ...desa].map((w) => w.id);
  const posyandu = (await db.from("posyandu").select("id").in("wilayah_id", semuaWilayah)).data ?? [];
  const idPosyandu = posyandu.map((p) => p.id);
  if (idPosyandu.length) {
    cek(await db.from("keluarga").delete().in("posyandu_id", idPosyandu), "hapus keluarga");
    cek(await db.from("posyandu").delete().in("id", idPosyandu), "hapus posyandu");
  }
  cek(await db.from("puskesmas").delete().in("wilayah_id", semuaWilayah), "hapus puskesmas");
  for (const lapis of [desa, kec, kab]) {
    if (lapis.length) cek(await db.from("wilayah").delete().in("id", lapis.map((w) => w.id)), "hapus wilayah");
  }
}

// --------------------------------------------------------------------------------------------
// Data anak contoh
// --------------------------------------------------------------------------------------------
type DefAnak = {
  nama: string; jk: JenisKelamin; lahir: string; posyandu: "Mawar" | "Melati";
  ibu: string; ayah: string; jumlahUkur: number;
  zBB: [number, number]; zTB: [number, number];
  beratTetapTerakhir?: number;    // jumlah bulan terakhir dengan berat sama (pola "2T")
  hariUkur: number;               // tanggal posyandu tiap bulan
};

const ANAK: DefAnak[] = [
  { nama: "Aisyah Putri", jk: "P", lahir: "2024-03-05", posyandu: "Mawar", ibu: "Siti Aminah", ayah: "Rudi Hartono", jumlahUkur: 8, zBB: [0.2, 0.1], zTB: [-0.3, -0.4], hariUkur: 18 },
  { nama: "Raka Pratama", jk: "L", lahir: "2023-11-12", posyandu: "Mawar", ibu: "Wulan Sari", ayah: "Agus Pratama", jumlahUkur: 8, zBB: [-1.6, -1.8], zTB: [-2.25, -2.5], hariUkur: 18 },
  { nama: "Naura Zahra", jk: "P", lahir: "2025-12-02", posyandu: "Mawar", ibu: "Fitri Handayani", ayah: "Andi Saputra", jumlahUkur: 9, zBB: [0, 0.3], zTB: [0.1, 0.2], hariUkur: 18 },
  { nama: "Dimas Aditya", jk: "L", lahir: "2022-07-20", posyandu: "Mawar", ibu: "Lestari", ayah: "Bambang Aditya", jumlahUkur: 7, zBB: [-2.1, -2.6], zTB: [-1.4, -1.5], hariUkur: 18 },
  { nama: "Salsabila", jk: "P", lahir: "2024-09-14", posyandu: "Mawar", ibu: "Nur Halimah", ayah: "Joko Susilo", jumlahUkur: 7, zBB: [-0.2, -0.6], zTB: [-0.3, -1.1], hariUkur: 18 },
  { nama: "Fajar Nugroho", jk: "L", lahir: "2023-05-30", posyandu: "Mawar", ibu: "Endang Wati", ayah: "Hadi Nugroho", jumlahUkur: 6, zBB: [1.3, 1.5], zTB: [0.4, 0.4], hariUkur: 18 },
  { nama: "Kirana Ayu", jk: "P", lahir: "2025-04-10", posyandu: "Melati", ibu: "Rini Astuti", ayah: "Dedi Kurniawan", jumlahUkur: 8, zBB: [0.4, 0.3], zTB: [0.2, 0.3], hariUkur: 20 },
  { nama: "Bagas Saputra", jk: "L", lahir: "2024-01-22", posyandu: "Melati", ibu: "Yuni Kartini", ayah: "Slamet Riyadi", jumlahUkur: 8, zBB: [-2.0, -2.3], zTB: [-3.0, -3.25], hariUkur: 20 },
  { nama: "Alya Rahma", jk: "P", lahir: "2023-08-08", posyandu: "Melati", ibu: "Dian Puspita", ayah: "Arif Rahman", jumlahUkur: 6, zBB: [-0.1, 0], zTB: [-0.5, -0.4], hariUkur: 20 },
  { nama: "Yusuf Hakim", jk: "L", lahir: "2025-06-15", posyandu: "Melati", ibu: "Ani Rohani", ayah: "Lukman Hakim", jumlahUkur: 7, zBB: [0.1, -0.9], zTB: [0, -0.2], beratTetapTerakhir: 3, hariUkur: 20 },
  { nama: "Nabila Safitri", jk: "P", lahir: "2022-12-01", posyandu: "Melati", ibu: "Sri Mulyani", ayah: "Teguh Santoso", jumlahUkur: 6, zBB: [-1.5, -1.6], zTB: [-2.05, -2.2], hariUkur: 20 },
  { nama: "Arka Wijaya", jk: "L", lahir: "2024-06-30", posyandu: "Melati", ibu: "Maya Sari", ayah: "Hendra Wijaya", jumlahUkur: 7, zBB: [0.3, 0.2], zTB: [0.5, 0.4], hariUkur: 20 },
];

const BULAN_TERAKHIR = { tahun: 2026, bulan: 10 }; // posyandu terakhir: Oktober 2026

function tanggalUkur(hari: number, mundurBulan: number): string {
  const d = new Date(Date.UTC(BULAN_TERAKHIR.tahun, BULAN_TERAKHIR.bulan - 1 - mundurBulan, hari));
  return d.toISOString().slice(0, 10);
}

type Ukur = { tglUkur: string; beratKg: number; tinggiCm: number; caraUkur: "terlentang" | "berdiri"; status: StatusGizi };

function bangkitkan(a: DefAnak): Ukur[] {
  const daftar: Ukur[] = [];
  for (let i = a.jumlahUkur - 1; i >= 0; i--) {
    const tglUkur = tanggalUkur(a.hariUkur, i);
    if (tglUkur < a.lahir) continue;
    const t = a.jumlahUkur === 1 ? 1 : (a.jumlahUkur - 1 - i) / (a.jumlahUkur - 1);
    const goyang = Math.sin((a.nama.length + i) * 1.7) * 0.03; // variasi kecil agar tidak terlalu mulus
    const hari = Math.round((Date.parse(tglUkur) - Date.parse(a.lahir)) / 86_400_000);
    let beratKg = Math.round((nilaiUntukZ("bbu", a.zBB[0] + (a.zBB[1] - a.zBB[0]) * t + goyang, hari, a.jk) ?? 0) * 10) / 10;
    const tinggiCm = Math.round((nilaiUntukZ("tbu", a.zTB[0] + (a.zTB[1] - a.zTB[0]) * t + goyang / 2, hari, a.jk) ?? 0) * 10) / 10;
    if (a.beratTetapTerakhir && i < a.beratTetapTerakhir && daftar.length) {
      beratKg = daftar[daftar.length - 1].beratKg;
    }
    const caraUkur = hari < 731 ? "terlentang" : "berdiri";
    daftar.push({ tglUkur, beratKg, tinggiCm, caraUkur,
      status: hitungStatusGizi({ tglLahir: a.lahir, tglUkur, jenisKelamin: a.jk, beratKg, tinggiCm, caraUkur }) });
  }
  return daftar;
}

/** Budi: sama persis dengan contoh di halaman depan (berat tidak naik 3 bulan terakhir). */
function budi(): Ukur[] {
  const lahir = "2025-08-18";
  const tinggi = [67.0, 67.8, 68.6, 69.3, 70.0, 70.6, 71.1, 71.6, 72.0]; // bulan 6–14
  return tinggi.map((tinggiCm, k) => {
    const bulan = 6 + k;
    const tglUkur = tanggalUkur(18, 14 - bulan);
    const beratKg = CONTOH_BERAT_BULANAN[bulan];
    return { tglUkur, beratKg, tinggiCm, caraUkur: "terlentang" as const,
      status: hitungStatusGizi({ tglLahir: lahir, tglUkur, jenisKelamin: "L", beratKg, tinggiCm, caraUkur: "terlentang" }) };
  });
}

const titikDari = (u: Ukur): Titik => ({
  tglUkur: u.tglUkur, umurHari: u.status.umurHari, beratKg: u.beratKg, tinggiCm: u.status.tinggiTerkoreksiCm,
  zBBU: u.status.bbu?.z ?? null, zTBU: u.status.tbu?.z ?? null, zBBTB: u.status.bbtb?.z ?? null,
  tingkatBBU: u.status.bbu?.kategori.tingkat, tingkatTBU: u.status.tbu?.kategori.tingkat, tingkatBBTB: u.status.bbtb?.kategori.tingkat,
});

// --------------------------------------------------------------------------------------------
async function main() {
  console.log("Membersihkan data demo lama…");
  await bersihkan();

  console.log("Membuat wilayah, puskesmas, posyandu…");
  const kab = cek(await db.from("wilayah").insert({ nama: KABUPATEN, tingkat: "kabupaten" }).select("id").single(), "kabupaten");
  const kec = cek(await db.from("wilayah").insert({ nama: "Kecamatan Sukamaju", tingkat: "kecamatan", induk_id: kab.id }).select("id").single(), "kecamatan");
  const desa = cek(await db.from("wilayah").insert({ nama: "Desa Sukamaju", tingkat: "desa", induk_id: kec.id }).select("id").single(), "desa");
  const pkm = cek(await db.from("puskesmas").insert({ nama: "Puskesmas Sukamaju", wilayah_id: kec.id }).select("id").single(), "puskesmas");
  const posyandu = cek(await db.from("posyandu").insert([
    { nama: "Posyandu Mawar", alamat: "Balai RW 05, Desa Sukamaju", wilayah_id: desa.id, puskesmas_id: pkm.id },
    { nama: "Posyandu Melati", alamat: "Balai RW 08, Desa Sukamaju", wilayah_id: desa.id, puskesmas_id: pkm.id },
  ]).select("id, nama"), "posyandu");
  const idPosyandu = (n: string) => posyandu.find((p) => p.nama === `Posyandu ${n}`)!.id;

  console.log("Membuat akun demo…");
  const idAkun: Record<string, string> = {};
  for (const a of AKUN) {
    const { data, error } = await db.auth.admin.createUser({
      email: a.email, password: PASSWORD_DEMO, email_confirm: true, user_metadata: { nama: a.nama },
    });
    if (error || !data.user) throw new Error(`akun ${a.email}: ${error?.message}`);
    idAkun[a.email] = data.user.id;
    cek(await db.from("profiles").update({
      nama: a.nama, peran: a.peran, puskesmas_id: a.peran === "bidan" ? pkm.id : null,
    }).eq("id", data.user.id), `profil ${a.email}`);
  }
  const kaderMawar = idAkun["kader.mawar@example.com"], kaderMelati = idAkun["kader.melati@example.com"];
  cek(await db.from("kader_posyandu").insert([
    { kader_id: kaderMawar, posyandu_id: idPosyandu("Mawar") },
    { kader_id: kaderMelati, posyandu_id: idPosyandu("Melati") },
  ]), "penugasan kader");

  console.log("Membuat keluarga, anak, dan riwayat pengukuran…");
  const semua: { def: Omit<DefAnak, "zBB" | "zTB" | "jumlahUkur">; ukur: Ukur[]; ortu?: string }[] = [
    { def: { nama: "Budi Santoso", jk: "L", lahir: "2025-08-18", posyandu: "Mawar", ibu: "Rina Santoso", ayah: "Eko Santoso", hariUkur: 18 },
      ukur: budi(), ortu: idAkun["orangtua@example.com"] },
    ...ANAK.map((a) => ({ def: a, ukur: bangkitkan(a) })),
  ];

  let jumlahUkur = 0, jumlahPeringatan = 0;
  for (const { def, ukur, ortu } of semua) {
    const kader = def.posyandu === "Mawar" ? kaderMawar : kaderMelati;
    const kel = cek(await db.from("keluarga").insert({
      posyandu_id: idPosyandu(def.posyandu), nama_ibu: def.ibu, nama_ayah: def.ayah,
      alamat: `${def.posyandu === "Mawar" ? "RW 05" : "RW 08"}, Desa Sukamaju`, orang_tua_user_id: ortu ?? null, dibuat_oleh: kader,
    }).select("id").single(), `keluarga ${def.nama}`);
    cek(await db.from("persetujuan").insert({ keluarga_id: kel.id, versi_kebijakan: "2026-10", dicatat_oleh: kader }), "persetujuan");
    const anak = cek(await db.from("anak").insert({
      keluarga_id: kel.id, posyandu_id: idPosyandu(def.posyandu), nama: def.nama, tgl_lahir: def.lahir, jenis_kelamin: def.jk,
    }).select("id").single(), `anak ${def.nama}`);

    const riwayat: Titik[] = [];
    for (const u of ukur) {
      const p = cek(await db.from("pengukuran").insert({
        anak_id: anak.id, kader_id: kader, tgl_ukur: u.tglUkur, umur_hari: u.status.umurHari,
        berat_kg: u.beratKg, tinggi_cm: u.tinggiCm, cara_ukur: u.caraUkur,
      }).select("id").single(), "pengukuran");
      cek(await db.from("status_gizi").insert({
        pengukuran_id: p.id,
        z_bbu: u.status.bbu?.z ?? null, z_tbu: u.status.tbu?.z ?? null, z_bbtb: u.status.bbtb?.z ?? null,
        kategori_bbu: u.status.bbu?.kategori.label ?? null, kategori_tbu: u.status.tbu?.kategori.label ?? null,
        kategori_bbtb: u.status.bbtb?.kategori.label ?? null,
      }), "status gizi");
      riwayat.push(titikDari(u));
      jumlahUkur++;

      // Peringatan hanya untuk pengukuran terbaru, seperti saat kader menyimpan data bulan ini.
      if (u === ukur[ukur.length - 1]) {
        for (const pr of cekPeringatan(riwayat)) {
          const ditindak = def.nama === "Bagas Saputra";
          cek(await db.from("peringatan").insert({
            anak_id: anak.id, pengukuran_id: p.id, jenis: pr.jenis, tingkat: pr.tingkat,
            status: ditindak ? "ditindaklanjuti" : "baru",
            catatan_tindak_lanjut: ditindak ? `${pr.pesan} Kunjungan rumah 21 Okt, dirujuk ke puskesmas untuk PMT.` : pr.pesan,
            ditangani_oleh: ditindak ? idAkun["bidan@example.com"] : null,
          }), "peringatan");
          jumlahPeringatan++;
        }
      }
    }
  }

  console.log("Mengisi basis pengetahuan dan bahan pangan…");
  cek(await db.from("pengetahuan").delete().not("id", "is", null), "hapus pengetahuan");
  cek(await db.from("pengetahuan").insert(PENGETAHUAN.map((p) => ({
    topik: p.topik, umur_min_bulan: p.umurMin, umur_max_bulan: p.umurMax, isi: p.isi, sumber: p.sumber, halaman: null,
  }))), "pengetahuan");
  cek(await db.from("bahan_pangan").delete().not("id", "is", null), "hapus bahan");
  cek(await db.from("bahan_pangan").insert(BAHAN.map((b) => ({
    nama: b.nama, protein_hewani: b.proteinHewani, harga_perkiraan: b.harga,
  }))), "bahan pangan");

  console.log(`Selesai: ${semua.length} anak, ${jumlahUkur} pengukuran, ${jumlahPeringatan} peringatan, ` +
    `${AKUN.length} akun demo, ${PENGETAHUAN.length} topik pengetahuan, ${BAHAN.length} bahan pangan.`);
}

main().catch((e) => {
  console.error("Seed gagal:", e.message);
  process.exit(1);
});
