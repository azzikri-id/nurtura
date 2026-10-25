import type { Metadata } from "next";
import { Suspense } from "react";
import { Memuat } from "@/components/app/Memuat";
import { NAMA_PERAN, wajibPeran, type Peran } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { AksiAkun, FormAkun, FormPosyandu } from "./FormAdmin";

export const metadata: Metadata = { title: "Admin" };

const akunDemo = (email: string) => /@example\.(com|org|net)$/i.test(email);

export default function BerandaAdmin() {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi />
    </Suspense>
  );
}

async function Isi() {
  await wajibPeran("admin");
  const supabase = await createClient();
  const [{ data: posyandu }, { data: penugasan }, { data: profil }, { data: puskesmas }, { data: desa }, { data: pengguna }] =
    await Promise.all([
      supabase.from("posyandu").select("id, nama, alamat, aktif, puskesmas(nama)").order("nama"),
      supabase.from("kader_posyandu").select("kader_id, posyandu_id, profiles(nama)"),
      supabase.from("profiles").select("id, nama, peran, puskesmas_id").order("nama"),
      supabase.from("puskesmas").select("id, nama").eq("aktif", true).order("nama"),
      supabase.from("wilayah").select("id, nama").eq("tingkat", "desa").order("nama"),
      createAdminClient().auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

  const jumlah = (profil ?? []).reduce<Record<string, number>>((s, p) => ({ ...s, [p.peran]: (s[p.peran] ?? 0) + 1 }), {});
  const akun = new Map((pengguna?.users ?? []).map((u) => [u.id, u]));
  const namaPuskesmas = new Map((puskesmas ?? []).map((p) => [p.id, p.nama]));
  const namaPosyandu = new Map((posyandu ?? []).map((p) => [p.id, p.nama]));
  const staf = (profil ?? []).filter((p) => p.peran === "kader" || p.peran === "bidan").map((p) => {
    const u = akun.get(p.id);
    const tugas = p.peran === "kader"
      ? (penugasan ?? []).filter((k) => k.kader_id === p.id).map((k) => namaPosyandu.get(k.posyandu_id)).filter(Boolean).join(", ")
      : namaPuskesmas.get(p.puskesmas_id ?? "") ?? "";
    const email = u?.email ?? "";
    return { ...p, email, tugas: tugas || "—", demo: akunDemo(email), aktif: !(u?.banned_until && new Date(u.banned_until) > new Date()) };
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Pengelolaan sistem</h1>
      <p className="mt-1 text-sm text-redup">
        Admin mengelola posyandu dan akun petugas. Sesuai kebijakan privasi, admin tidak dapat melihat data kesehatan anak.
      </p>

      <dl className="mt-6 grid grid-cols-2 divide-x divide-garis rounded-xl border border-garis bg-white sm:grid-cols-4">
        {(["kader", "bidan", "orang_tua", "admin"] as Peran[]).map((p) => (
          <div key={p} className="px-4 py-3">
            <dt className="text-xs text-redup">{NAMA_PERAN[p]}</dt>
            <dd className="text-2xl font-bold tabular-nums text-tinta">{jumlah[p] ?? 0}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 text-lg font-bold text-tinta">Posyandu</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-garis bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-redup">
            <tr className="border-b border-garis">
              <th scope="col" className="px-5 py-3 font-medium">Posyandu</th>
              <th scope="col" className="px-3 py-3 font-medium">Alamat</th>
              <th scope="col" className="px-3 py-3 font-medium">Puskesmas</th>
              <th scope="col" className="px-5 py-3 font-medium">Kader</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-garis">
            {(posyandu ?? []).map((p) => (
              <tr key={p.id}>
                <th scope="row" className="px-5 py-3 text-left font-semibold text-tinta">{p.nama}</th>
                <td className="px-3 py-3 text-redup">{p.alamat ?? "—"}</td>
                <td className="px-3 py-3 text-tinta">{(p.puskesmas as unknown as { nama: string } | null)?.nama ?? "—"}</td>
                <td className="px-5 py-3 text-tinta">
                  {(penugasan ?? []).filter((k) => k.posyandu_id === p.id)
                    .map((k) => (k.profiles as unknown as { nama: string } | null)?.nama).filter(Boolean).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FormPosyandu puskesmas={puskesmas ?? []} desa={desa ?? []} />

      <h2 className="mt-10 text-lg font-bold text-tinta">Akun kader dan bidan</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-garis bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-redup">
            <tr className="border-b border-garis">
              <th scope="col" className="px-5 py-3 font-medium">Nama</th>
              <th scope="col" className="px-3 py-3 font-medium">Peran</th>
              <th scope="col" className="px-3 py-3 font-medium">Bertugas di</th>
              <th scope="col" className="px-3 py-3 font-medium">Status</th>
              <th scope="col" className="px-5 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-garis">
            {staf.map((s) => (
              <tr key={s.id} className="align-top">
                <th scope="row" className="px-5 py-3 text-left font-semibold text-tinta">
                  {s.nama}
                  <span className="block break-all text-xs font-normal text-redup">{s.email}</span>
                </th>
                <td className="px-3 py-3 text-tinta">{NAMA_PERAN[s.peran as Peran]}</td>
                <td className="px-3 py-3 text-tinta">{s.tugas}</td>
                <td className={`px-3 py-3 ${s.aktif ? "text-normal" : "text-bahaya"}`}>{s.aktif ? "Aktif" : "Nonaktif"}</td>
                <td className="px-5 py-3">
                  {s.demo
                    ? <span className="text-xs text-redup">Akun demo, tidak dapat diubah</span>
                    : <AksiAkun id={s.id} nama={s.nama} aktif={s.aktif} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FormAkun posyandu={(posyandu ?? []).map((p) => ({ id: p.id, nama: p.nama }))} puskesmas={puskesmas ?? []} />
      <p className="mt-4 text-sm text-redup">
        Akun orang tua dibuat sendiri lewat halaman Daftar. Kata sandi petugas yang lupa diatur ulang di sini, lalu pengguna bisa menggantinya lewat menu Akun saya.
      </p>
    </div>
  );
}
