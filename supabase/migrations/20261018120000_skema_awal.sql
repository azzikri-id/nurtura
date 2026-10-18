-- Nurtura — skema awal
-- Organisasi (wilayah, puskesmas, posyandu) → pengguna & peran → keluarga & anak →
-- pengukuran → status gizi & peringatan, ditambah referensi untuk fitur AI dan audit.
-- Tabel referensi WHO (LMS) tidak disimpan di database: datanya dibundel di aplikasi
-- (src/lib/gizi/data) karena perhitungan z-score adalah modul murni.

-- ---------------------------------------------------------------------------
-- Tipe
-- ---------------------------------------------------------------------------
create type public.peran as enum ('admin', 'bidan', 'kader', 'orang_tua');
create type public.tingkat_wilayah as enum ('kabupaten', 'kecamatan', 'desa');
create type public.jenis_kelamin as enum ('L', 'P');
create type public.cara_ukur as enum ('terlentang', 'berdiri');
create type public.tingkat_peringatan as enum ('bahaya', 'waspada', 'perhatian');
create type public.status_peringatan as enum ('baru', 'ditindaklanjuti', 'selesai');

-- ---------------------------------------------------------------------------
-- Organisasi
-- ---------------------------------------------------------------------------
create table public.wilayah (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (char_length(nama) between 2 and 120),
  tingkat public.tingkat_wilayah not null,
  induk_id uuid references public.wilayah (id) on delete restrict,
  aktif boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

create table public.puskesmas (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (char_length(nama) between 2 and 120),
  wilayah_id uuid not null references public.wilayah (id) on delete restrict,
  aktif boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

create table public.posyandu (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (char_length(nama) between 2 and 120),
  alamat text,
  wilayah_id uuid not null references public.wilayah (id) on delete restrict,
  puskesmas_id uuid not null references public.puskesmas (id) on delete restrict,
  aktif boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pengguna & peran
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null default '' check (char_length(nama) <= 120),
  peran public.peran not null default 'orang_tua',
  puskesmas_id uuid references public.puskesmas (id) on delete set null, -- untuk bidan
  dibuat_pada timestamptz not null default now()
);

create table public.kader_posyandu (
  kader_id uuid not null references public.profiles (id) on delete cascade,
  posyandu_id uuid not null references public.posyandu (id) on delete cascade,
  primary key (kader_id, posyandu_id)
);

-- ---------------------------------------------------------------------------
-- Keluarga & anak
-- ---------------------------------------------------------------------------
create table public.keluarga (
  id uuid primary key default gen_random_uuid(),
  posyandu_id uuid not null references public.posyandu (id) on delete restrict,
  nama_ibu text not null check (char_length(nama_ibu) between 2 and 120),
  nama_ayah text check (char_length(nama_ayah) <= 120),
  alamat text check (char_length(alamat) <= 300),
  no_hp text check (no_hp ~ '^[0-9+][0-9]{7,14}$'),
  kode_undangan text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  orang_tua_user_id uuid references public.profiles (id) on delete set null,
  dibuat_oleh uuid references public.profiles (id) on delete set null,
  dibuat_pada timestamptz not null default now()
);

create table public.anak (
  id uuid primary key default gen_random_uuid(),
  keluarga_id uuid not null references public.keluarga (id) on delete cascade,
  posyandu_id uuid not null references public.posyandu (id) on delete restrict,
  nama text not null check (char_length(nama) between 1 and 120),
  tgl_lahir date not null, -- tidak boleh di masa depan: divalidasi di aplikasi
  jenis_kelamin public.jenis_kelamin not null,
  nik_terenkripsi text, -- AES-256-GCM di sisi server, tidak pernah disimpan polos
  aktif boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

-- Persetujuan orang tua atas pemrosesan data anak (UU PDP No. 27/2022).
create table public.persetujuan (
  id uuid primary key default gen_random_uuid(),
  keluarga_id uuid not null references public.keluarga (id) on delete cascade,
  versi_kebijakan text not null,
  disetujui_pada timestamptz not null default now(),
  dicatat_oleh uuid references public.profiles (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Pengukuran, status gizi, peringatan
-- ---------------------------------------------------------------------------
create table public.pengukuran (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references public.anak (id) on delete cascade,
  kader_id uuid references public.profiles (id) on delete set null,
  tgl_ukur date not null,
  umur_hari integer not null check (umur_hari between 0 and 1856),
  berat_kg numeric(5, 2) not null check (berat_kg between 0.5 and 40),
  tinggi_cm numeric(5, 1) not null check (tinggi_cm between 35 and 130),
  cara_ukur public.cara_ukur not null,
  lingkar_kepala_cm numeric(4, 1) check (lingkar_kepala_cm between 25 and 60),
  catatan_koreksi text check (char_length(catatan_koreksi) <= 300), -- alasan bila tetap disimpan meski ditandai tidak wajar
  dibuat_pada timestamptz not null default now()
);

create table public.status_gizi (
  pengukuran_id uuid primary key references public.pengukuran (id) on delete cascade,
  z_bbu numeric(5, 2),
  z_tbu numeric(5, 2),
  z_bbtb numeric(5, 2),
  kategori_bbu text,
  kategori_tbu text,
  kategori_bbtb text
);

create table public.peringatan (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references public.anak (id) on delete cascade,
  pengukuran_id uuid references public.pengukuran (id) on delete cascade,
  jenis text not null, -- mis. 'bb_tidak_naik_2x', 'z_turun', 'kategori_berisiko'
  tingkat public.tingkat_peringatan not null,
  status public.status_peringatan not null default 'baru',
  catatan_tindak_lanjut text check (char_length(catatan_tindak_lanjut) <= 1000),
  ditangani_oleh uuid references public.profiles (id) on delete set null,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

create table public.imunisasi (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references public.anak (id) on delete cascade,
  jenis_vaksin text not null,
  tgl_diberikan date not null,
  dicatat_oleh uuid references public.profiles (id) on delete set null,
  unique (anak_id, jenis_vaksin, tgl_diberikan)
);

-- ---------------------------------------------------------------------------
-- Referensi untuk fitur AI
-- ---------------------------------------------------------------------------
create table public.pengetahuan (
  id uuid primary key default gen_random_uuid(),
  topik text not null,
  umur_min_bulan smallint not null default 0 check (umur_min_bulan between 0 and 60),
  umur_max_bulan smallint not null default 60 check (umur_max_bulan between 0 and 60),
  isi text not null,
  sumber text not null,   -- mis. 'Buku KIA Kemenkes 2024'
  halaman text,
  tsv tsvector generated always as (
    setweight(to_tsvector('indonesian', coalesce(topik, '')), 'A') ||
    setweight(to_tsvector('indonesian', coalesce(isi, '')), 'B')
  ) stored,
  check (umur_min_bulan <= umur_max_bulan)
);

create table public.bahan_pangan (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  energi_kkal numeric(6, 1),   -- per 100 g (Tabel Komposisi Pangan Indonesia)
  protein_g numeric(5, 1),
  lemak_g numeric(5, 1),
  zat_besi_mg numeric(5, 1),
  protein_hewani boolean not null default false,
  harga_perkiraan integer       -- rupiah per 100 g
);

create table public.percakapan_ai (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references public.anak (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  pertanyaan text not null check (char_length(pertanyaan) <= 1000),
  jawaban text not null,
  sumber_ids uuid[] not null default '{}',
  dibuat_pada timestamptz not null default now()
);

create table public.rekomendasi_menu (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references public.anak (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  input_bahan text[] not null default '{}',
  budget integer check (budget between 0 and 1000000),
  menu_json jsonb not null,
  lolos_validasi boolean not null,
  dibuat_pada timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  aksi text not null,       -- 'baca' | 'tambah' | 'ubah' | 'hapus' | 'ekspor' | 'ditolak'
  tabel text not null,
  record_id text,
  waktu timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indeks
-- ---------------------------------------------------------------------------
create index on public.wilayah (induk_id);
create index on public.puskesmas (wilayah_id);
create index on public.posyandu (puskesmas_id);
create index on public.posyandu (wilayah_id);
create index on public.profiles (puskesmas_id);
create index on public.kader_posyandu (posyandu_id);
create index on public.keluarga (posyandu_id);
create index on public.keluarga (orang_tua_user_id);
create index on public.anak (posyandu_id);
create index on public.anak (keluarga_id);
create index anak_nama_idx on public.anak using gin (to_tsvector('simple', nama));
create index on public.persetujuan (keluarga_id);
create index on public.pengukuran (anak_id, tgl_ukur desc);
create index on public.peringatan (anak_id);
create index on public.peringatan (status) where status <> 'selesai';
create index on public.imunisasi (anak_id);
create index on public.pengetahuan using gin (tsv);
create index on public.percakapan_ai (user_id, dibuat_pada desc);
create index on public.rekomendasi_menu (user_id, dibuat_pada desc);
create index on public.audit_log (user_id, waktu desc);

-- ---------------------------------------------------------------------------
-- Fungsi bantu untuk RLS (schema private, tidak diekspos lewat API)
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.peran_saya() returns public.peran
language sql stable security definer set search_path = '' as $$
  select peran from public.profiles where id = auth.uid()
$$;

create function private.posyandu_kader() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select posyandu_id from public.kader_posyandu where kader_id = auth.uid()
$$;

create function private.posyandu_bidan() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select ps.id from public.posyandu ps
  join public.profiles p on p.puskesmas_id = ps.puskesmas_id
  where p.id = auth.uid() and p.peran = 'bidan'
$$;

-- Boleh membaca data anak: kader posyandunya, bidan puskesmasnya, atau orang tuanya.
create function private.boleh_baca_anak(p_anak_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.anak a
    join public.keluarga k on k.id = a.keluarga_id
    where a.id = p_anak_id
      and (
        a.posyandu_id in (select private.posyandu_kader())
        or a.posyandu_id in (select private.posyandu_bidan())
        or k.orang_tua_user_id = auth.uid()
      )
  )
$$;

-- Boleh menulis pengukuran/peringatan: hanya kader posyandu anak tersebut.
create function private.boleh_tulis_anak(p_anak_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.anak a
    where a.id = p_anak_id and a.posyandu_id in (select private.posyandu_kader())
  )
$$;

grant execute on all functions in schema private to authenticated;

-- Profil dibuat otomatis saat akun dibuat. Peran SELALU 'orang_tua' di sini;
-- peran lain hanya bisa diberikan admin (metadata dari klien diabaikan).
create function private.buat_profil_baru() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nama)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'nama', 120), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.buat_profil_baru();

-- Orang tua menautkan akunnya ke keluarga lewat kode undangan dari kader.
create function public.klaim_kode_undangan(p_kode text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_keluarga uuid;
begin
  if auth.uid() is null then
    raise exception 'Harus masuk terlebih dahulu';
  end if;
  update public.keluarga
     set orang_tua_user_id = auth.uid()
   where kode_undangan = upper(trim(p_kode))
     and orang_tua_user_id is null
  returning id into v_keluarga;
  if v_keluarga is null then
    raise exception 'Kode undangan tidak valid atau sudah dipakai';
  end if;
  return v_keluarga;
end;
$$;

revoke execute on function public.klaim_kode_undangan(text) from public, anon;
grant execute on function public.klaim_kode_undangan(text) to authenticated;

-- Pencarian basis pengetahuan untuk asisten gizi (full-text search + filter umur).
-- Pertanyaan orang tua memakai bahasa sehari-hari ("anak saya susah makan"), jadi kata-katanya
-- digabung dengan OR (cukup satu yang cocok) lalu diurutkan dari yang paling banyak cocok.
create function public.cari_pengetahuan(p_pertanyaan text, p_umur_bulan integer, p_batas integer default 5)
returns table (id uuid, topik text, isi text, sumber text, halaman text, skor real)
language sql stable set search_path = '' as $$
  with q as (
    select nullif(replace(plainto_tsquery('indonesian', p_pertanyaan)::text, ' & ', ' | '), '') as teks
  )
  select p.id, p.topik, p.isi, p.sumber, p.halaman,
         ts_rank(p.tsv, to_tsquery('indonesian', q.teks)) as skor
    from public.pengetahuan p, q
   where q.teks is not null
     and p.tsv @@ to_tsquery('indonesian', q.teks)
     and p_umur_bulan between p.umur_min_bulan and p.umur_max_bulan
   order by skor desc
   limit least(greatest(p_batas, 1), 10)
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.wilayah enable row level security;
alter table public.puskesmas enable row level security;
alter table public.posyandu enable row level security;
alter table public.profiles enable row level security;
alter table public.kader_posyandu enable row level security;
alter table public.keluarga enable row level security;
alter table public.anak enable row level security;
alter table public.persetujuan enable row level security;
alter table public.pengukuran enable row level security;
alter table public.status_gizi enable row level security;
alter table public.peringatan enable row level security;
alter table public.imunisasi enable row level security;
alter table public.pengetahuan enable row level security;
alter table public.bahan_pangan enable row level security;
alter table public.percakapan_ai enable row level security;
alter table public.rekomendasi_menu enable row level security;
alter table public.audit_log enable row level security;

-- Data organisasi & referensi: semua pengguna masuk boleh membaca, hanya admin yang mengubah.
create policy "baca organisasi" on public.wilayah for select to authenticated using (true);
create policy "admin kelola" on public.wilayah for all to authenticated
  using (private.peran_saya() = 'admin') with check (private.peran_saya() = 'admin');
create policy "baca organisasi" on public.puskesmas for select to authenticated using (true);
create policy "admin kelola" on public.puskesmas for all to authenticated
  using (private.peran_saya() = 'admin') with check (private.peran_saya() = 'admin');
create policy "baca organisasi" on public.posyandu for select to authenticated using (true);
create policy "admin kelola" on public.posyandu for all to authenticated
  using (private.peran_saya() = 'admin') with check (private.peran_saya() = 'admin');
create policy "baca referensi" on public.pengetahuan for select to authenticated using (true);
create policy "admin kelola" on public.pengetahuan for all to authenticated
  using (private.peran_saya() = 'admin') with check (private.peran_saya() = 'admin');
create policy "baca referensi" on public.bahan_pangan for select to authenticated using (true);
create policy "admin kelola" on public.bahan_pangan for all to authenticated
  using (private.peran_saya() = 'admin') with check (private.peran_saya() = 'admin');

-- Profil: lihat profil sendiri; admin melihat & mengatur semua (termasuk peran).
create policy "lihat profil sendiri" on public.profiles for select to authenticated
  using (id = auth.uid() or private.peran_saya() = 'admin');
create policy "admin kelola profil" on public.profiles for update to authenticated
  using (private.peran_saya() = 'admin') with check (private.peran_saya() = 'admin');

-- Penugasan kader.
create policy "lihat penugasan" on public.kader_posyandu for select to authenticated
  using (kader_id = auth.uid() or private.peran_saya() = 'admin');
create policy "admin kelola penugasan" on public.kader_posyandu for all to authenticated
  using (private.peran_saya() = 'admin') with check (private.peran_saya() = 'admin');

-- Keluarga.
create policy "baca keluarga" on public.keluarga for select to authenticated
  using (
    posyandu_id in (select private.posyandu_kader())
    or posyandu_id in (select private.posyandu_bidan())
    or orang_tua_user_id = auth.uid()
  );
create policy "kader tambah keluarga" on public.keluarga for insert to authenticated
  with check (posyandu_id in (select private.posyandu_kader()));
create policy "kader ubah keluarga" on public.keluarga for update to authenticated
  using (posyandu_id in (select private.posyandu_kader()))
  with check (posyandu_id in (select private.posyandu_kader()));

-- Anak.
-- Memakai kolom baris langsung (bukan private.boleh_baca_anak) supaya INSERT ... RETURNING
-- oleh kader tetap lolos: fungsi itu belum bisa melihat baris yang baru dibuat.
create policy "baca anak" on public.anak for select to authenticated
  using (
    posyandu_id in (select private.posyandu_kader())
    or posyandu_id in (select private.posyandu_bidan())
    or exists (select 1 from public.keluarga k where k.id = anak.keluarga_id and k.orang_tua_user_id = auth.uid())
  );
create policy "kader tambah anak" on public.anak for insert to authenticated
  with check (
    posyandu_id in (select private.posyandu_kader())
    and exists (select 1 from public.keluarga k where k.id = anak.keluarga_id and k.posyandu_id = anak.posyandu_id)
  );
create policy "kader ubah anak" on public.anak for update to authenticated
  using (posyandu_id in (select private.posyandu_kader()))
  with check (posyandu_id in (select private.posyandu_kader()));

-- Persetujuan.
create policy "baca persetujuan" on public.persetujuan for select to authenticated
  using (exists (
    select 1 from public.keluarga k where k.id = persetujuan.keluarga_id and (
      k.posyandu_id in (select private.posyandu_kader())
      or k.posyandu_id in (select private.posyandu_bidan())
      or k.orang_tua_user_id = auth.uid())
  ));
create policy "kader catat persetujuan" on public.persetujuan for insert to authenticated
  with check (exists (
    select 1 from public.keluarga k where k.id = persetujuan.keluarga_id and k.posyandu_id in (select private.posyandu_kader())
  ));

-- Pengukuran & status gizi.
create policy "baca pengukuran" on public.pengukuran for select to authenticated
  using (private.boleh_baca_anak(anak_id));
create policy "kader tambah pengukuran" on public.pengukuran for insert to authenticated
  with check (private.boleh_tulis_anak(anak_id) and kader_id = auth.uid());
create policy "baca status gizi" on public.status_gizi for select to authenticated
  using (exists (select 1 from public.pengukuran p where p.id = status_gizi.pengukuran_id and private.boleh_baca_anak(p.anak_id)));
create policy "kader tambah status gizi" on public.status_gizi for insert to authenticated
  with check (exists (select 1 from public.pengukuran p where p.id = status_gizi.pengukuran_id and private.boleh_tulis_anak(p.anak_id)));

-- Peringatan: dibuat kader, ditindaklanjuti kader atau bidan wilayahnya.
create policy "baca peringatan" on public.peringatan for select to authenticated
  using (private.boleh_baca_anak(anak_id));
create policy "kader tambah peringatan" on public.peringatan for insert to authenticated
  with check (private.boleh_tulis_anak(anak_id));
create policy "tindak lanjut peringatan" on public.peringatan for update to authenticated
  using (
    private.boleh_tulis_anak(anak_id)
    or exists (select 1 from public.anak a where a.id = peringatan.anak_id and a.posyandu_id in (select private.posyandu_bidan()))
  )
  with check (
    private.boleh_tulis_anak(anak_id)
    or exists (select 1 from public.anak a where a.id = peringatan.anak_id and a.posyandu_id in (select private.posyandu_bidan()))
  );

-- Imunisasi.
create policy "baca imunisasi" on public.imunisasi for select to authenticated
  using (private.boleh_baca_anak(anak_id));
create policy "kader tambah imunisasi" on public.imunisasi for insert to authenticated
  with check (private.boleh_tulis_anak(anak_id));

-- Riwayat AI: hanya milik pengguna sendiri, untuk anak yang boleh ia akses.
create policy "riwayat tanya sendiri" on public.percakapan_ai for select to authenticated
  using (user_id = auth.uid());
create policy "simpan tanya sendiri" on public.percakapan_ai for insert to authenticated
  with check (user_id = auth.uid() and private.boleh_baca_anak(anak_id));
create policy "riwayat menu sendiri" on public.rekomendasi_menu for select to authenticated
  using (user_id = auth.uid());
create policy "simpan menu sendiri" on public.rekomendasi_menu for insert to authenticated
  with check (user_id = auth.uid() and private.boleh_baca_anak(anak_id));

-- Audit: pengguna hanya bisa menambah jejak atas namanya sendiri; hanya admin yang membaca.
create policy "tulis audit sendiri" on public.audit_log for insert to authenticated
  with check (user_id = auth.uid());
create policy "admin baca audit" on public.audit_log for select to authenticated
  using (private.peran_saya() = 'admin');
