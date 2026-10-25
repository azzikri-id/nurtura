// Run the Nurtura migration on real Postgres (PGlite) with a stub of Supabase's auth schema,
// then exercise the RLS rules per role.  Usage: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const db = new PGlite();
const sql = readFileSync(process.argv[2] ?? new URL("../migrations/20261018120000_skema_awal.sql", import.meta.url), "utf8");

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated;
  grant execute on function auth.uid() to authenticated;
`);
await db.exec(sql);
await db.exec(`
  grant usage on schema public to authenticated;
  grant all on all tables in schema public to authenticated;
  grant all on all sequences in schema public to authenticated;
`);
console.log("migration OK");

let pass = 0, fail = 0;
const ok = (name, cond) => {
  if (cond) pass++; else fail++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
};
const asUser = async (uid, fn) => {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
};
const tries = async (q, params = []) => { try { await db.query(q, params); return true; } catch { return false; } };
const count = async (q) => (await db.query(q)).rows[0].n;

const U = { admin: "00000000-0000-0000-0000-00000000000a", k1: "00000000-0000-0000-0000-0000000000b1",
  k2: "00000000-0000-0000-0000-0000000000b2", bidan: "00000000-0000-0000-0000-00000000000c",
  ortu: "00000000-0000-0000-0000-00000000000d" };

// Accounts (trigger creates profiles). The ortu tries to grant itself admin via metadata.
for (const [k, id] of Object.entries(U))
  await db.query(`insert into auth.users (id, raw_user_meta_data) values ($1, $2)`,
    [id, JSON.stringify(k === "ortu" ? { nama: "Rina", peran: "admin" } : { nama: k })]);
ok("trigger membuat profil untuk setiap akun", (await count(`select count(*)::int n from profiles`)) === 5);
ok("metadata peran dari klien diabaikan (tetap orang_tua)",
  (await db.query(`select peran from profiles where id = $1`, [U.ortu])).rows[0].peran === "orang_tua");

// Organisation setup as superuser.
const ids = (await db.query(`
  with w as (insert into wilayah (nama, tingkat) values ('Desa Sukamaju', 'desa') returning id),
       pk as (insert into puskesmas (nama, wilayah_id) select 'Puskesmas A', id from w returning id, wilayah_id),
       pk2 as (insert into puskesmas (nama, wilayah_id) select 'Puskesmas B', id from w returning id, wilayah_id),
       p1 as (insert into posyandu (nama, wilayah_id, puskesmas_id) select 'Posyandu Mawar', wilayah_id, id from pk returning id),
       p2 as (insert into posyandu (nama, wilayah_id, puskesmas_id) select 'Posyandu Melati', wilayah_id, id from pk2 returning id)
  select (select id from pk) pk, (select id from p1) p1, (select id from p2) p2`)).rows[0];
await db.query(`update profiles set peran='admin' where id=$1`, [U.admin]);
await db.query(`update profiles set peran='kader' where id in ($1,$2)`, [U.k1, U.k2]);
await db.query(`update profiles set peran='bidan', puskesmas_id=$2 where id=$1`, [U.bidan, ids.pk]);
await db.query(`insert into kader_posyandu values ($1,$2),($3,$4)`, [U.k1, ids.p1, U.k2, ids.p2]);

// Kader 1 works in Posyandu Mawar (p1).
let kel1, anak1, kode;
await asUser(U.k1, async () => {
  const r = await db.query(`insert into keluarga (posyandu_id, nama_ibu) values ($1, 'Rina') returning id, kode_undangan`, [ids.p1]);
  kel1 = r.rows[0].id; kode = r.rows[0].kode_undangan;
  ok("kader menambah keluarga di posyandunya", !!kel1);
  ok("kader TIDAK bisa menambah keluarga di posyandu lain",
    !(await tries(`insert into keluarga (posyandu_id, nama_ibu) values ($1, 'X')`, [ids.p2])));
  anak1 = (await db.query(`insert into anak (keluarga_id, posyandu_id, nama, tgl_lahir, jenis_kelamin)
    values ($1,$2,'Budi','2025-10-18','L') returning id`, [kel1, ids.p1])).rows[0].id;
  ok("kader menambah anak di posyandunya", !!anak1);
  ok("kader TIDAK bisa mendaftarkan anak ke posyandu yang tidak cocok dengan keluarganya",
    !(await tries(`insert into anak (keluarga_id, posyandu_id, nama, tgl_lahir, jenis_kelamin)
      values ($1,$2,'Ani','2025-10-18','P')`, [kel1, ids.p2])));
  ok("kader menambah pengukuran atas namanya",
    await tries(`insert into pengukuran (anak_id, kader_id, tgl_ukur, umur_hari, berat_kg, tinggi_cm, cara_ukur)
      values ($1,$2,'2026-10-18',365,8.2,74.5,'terlentang')`, [anak1, U.k1]));
  ok("kader TIDAK bisa mengaku sebagai kader lain",
    !(await tries(`insert into pengukuran (anak_id, kader_id, tgl_ukur, umur_hari, berat_kg, tinggi_cm, cara_ukur)
      values ($1,$2,'2026-10-18',365,8.2,74.5,'terlentang')`, [anak1, U.k2])));
  ok("validasi data: berat di luar rentang ditolak",
    !(await tries(`insert into pengukuran (anak_id, kader_id, tgl_ukur, umur_hari, berat_kg, tinggi_cm, cara_ukur)
      values ($1,$2,'2026-10-18',365,80,74.5,'terlentang')`, [anak1, U.k1])));
  ok("kader menambah peringatan", await tries(
    `insert into peringatan (anak_id, jenis, tingkat) values ($1,'kategori_berisiko','waspada')`, [anak1]));
});

await asUser(U.k2, async () => {
  ok("kader posyandu lain TIDAK melihat anak", (await count(`select count(*)::int n from anak`)) === 0);
  ok("kader posyandu lain TIDAK melihat pengukuran", (await count(`select count(*)::int n from pengukuran`)) === 0);
  ok("kader posyandu lain TIDAK bisa menambah pengukuran", !(await tries(
    `insert into pengukuran (anak_id, kader_id, tgl_ukur, umur_hari, berat_kg, tinggi_cm, cara_ukur)
     values ($1,$2,'2026-10-18',365,8,74,'terlentang')`, [anak1, U.k2])));
});

await asUser(U.bidan, async () => {
  ok("bidan melihat anak di wilayah puskesmasnya", (await count(`select count(*)::int n from anak`)) === 1);
  ok("bidan menindaklanjuti peringatan", (await db.query(
    `update peringatan set status='ditindaklanjuti', catatan_tindak_lanjut='Kunjungan rumah' returning id`)).rows.length === 1);
  ok("bidan TIDAK bisa menambah pengukuran", !(await tries(
    `insert into pengukuran (anak_id, kader_id, tgl_ukur, umur_hari, berat_kg, tinggi_cm, cara_ukur)
     values ($1,$2,'2026-10-18',365,8,74,'terlentang')`, [anak1, U.bidan])));
});

await asUser(U.ortu, async () => {
  ok("orang tua belum melihat anak sebelum klaim kode", (await count(`select count(*)::int n from anak`)) === 0);
  ok("klaim kode undangan berhasil", await tries(`select klaim_kode_undangan($1)`, [kode.toLowerCase()]));
  ok("orang tua melihat anaknya setelah klaim", (await count(`select count(*)::int n from anak`)) === 1);
  ok("orang tua melihat riwayat pengukuran anaknya", (await count(`select count(*)::int n from pengukuran`)) === 1);
  ok("kode yang sudah dipakai tidak bisa diklaim lagi", !(await tries(`select klaim_kode_undangan($1)`, [kode])));
  ok("orang tua TIDAK bisa menambah pengukuran", !(await tries(
    `insert into pengukuran (anak_id, kader_id, tgl_ukur, umur_hari, berat_kg, tinggi_cm, cara_ukur)
     values ($1,$2,'2026-10-18',365,8,74,'terlentang')`, [anak1, U.ortu])));
  ok("orang tua TIDAK bisa menaikkan perannya sendiri",
    (await db.query(`update profiles set peran='admin' where id=$1 returning id`, [U.ortu])).rows.length === 0);
  ok("orang tua menyimpan riwayat tanya AI untuk anaknya", await tries(
    `insert into percakapan_ai (anak_id, user_id, pertanyaan, jawaban) values ($1,$2,'?','!')`, [anak1, U.ortu]));
  ok("orang tua TIDAK bisa membaca audit log", (await count(`select count(*)::int n from audit_log`)) === 0);
});

await asUser(U.admin, async () => {
  ok("admin mengelola data master", await tries(`insert into wilayah (nama, tingkat) values ('Kec. Baru','kecamatan')`));
  ok("admin TIDAK melihat data kesehatan anak", (await count(`select count(*)::int n from anak`)) === 0);
});

// Pengelolaan akun dan posyandu hanya untuk admin; pengguna lain tidak bisa menaikkan peran atau penugasannya sendiri.
const peranDari = async (id) => (await db.query(`select peran from profiles where id = $1`, [id])).rows[0].peran;
await asUser(U.ortu, async () => {
  await db.query(`update profiles set peran = 'admin' where id = $1`, [U.ortu]);
  ok("orang tua TIDAK bisa menambah posyandu", !(await tries(
    `insert into posyandu (nama, wilayah_id, puskesmas_id) select 'Posyandu Palsu', wilayah_id, id from puskesmas limit 1`)));
});
ok("peran orang tua tetap orang_tua setelah percobaan menaikkan peran", (await peranDari(U.ortu)) === "orang_tua");
await asUser(U.k1, async () => {
  await db.query(`update profiles set peran = 'admin' where id = $1`, [U.k1]);
  ok("kader TIDAK bisa menambah posyandu", !(await tries(
    `insert into posyandu (nama, wilayah_id, puskesmas_id) select 'Posyandu Palsu', wilayah_id, id from puskesmas limit 1`)));
  ok("kader TIDAK bisa menugaskan dirinya ke posyandu lain", !(await tries(
    `insert into kader_posyandu (kader_id, posyandu_id) values ($1, $2)`, [U.k1, ids.p2])));
});
ok("peran kader tetap kader setelah percobaan menaikkan peran", (await peranDari(U.k1)) === "kader");
await asUser(U.bidan, async () => {
  ok("bidan TIDAK bisa mengubah peran akun lain", (await db.query(`update profiles set peran = 'admin' where id = $1 returning id`, [U.k2])).rows.length === 0);
});
await asUser(U.admin, async () => {
  ok("admin menambah posyandu", await tries(
    `insert into posyandu (nama, wilayah_id, puskesmas_id) select 'Posyandu Baru', wilayah_id, id from puskesmas limit 1`));
  ok("admin menugaskan kader ke posyandu", await tries(
    `insert into kader_posyandu (kader_id, posyandu_id) values ($1, $2)`, [U.k2, ids.p1]));
  ok("admin menetapkan peran akun", (await db.query(`update profiles set peran = 'kader' where id = $1 returning id`, [U.ortu])).rows.length === 1);
});
await db.query(`update profiles set peran = 'orang_tua' where id = $1`, [U.ortu]);

// Knowledge-base search (Indonesian full-text search + age filter).
await db.query(`insert into pengetahuan (topik, umur_min_bulan, umur_max_bulan, isi, sumber, halaman) values
  ('Anak susah makan', 6, 24, 'Tawarkan makanan dengan tekstur sesuai umur dan jadwal makan teratur.', 'Buku KIA', '45'),
  ('Imunisasi dasar', 0, 12, 'Imunisasi dasar lengkap sebelum usia satu tahun.', 'Buku KIA', '60')`);
await asUser(U.ortu, async () => {
  const r = await db.query(`select topik from cari_pengetahuan('anak saya susah makan', 10)`);
  ok("cari_pengetahuan menemukan topik relevan (bahasa Indonesia)", r.rows[0]?.topik === "Anak susah makan");
  const r2 = await db.query(`select topik from cari_pengetahuan('susah makan', 36)`);
  ok("cari_pengetahuan memfilter rentang umur", r2.rows.length === 0);
});

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
