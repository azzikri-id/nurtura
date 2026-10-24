import type { Metadata } from "next";
import { Suspense } from "react";
import { Memuat } from "@/components/app/Memuat";
import { NAMA_PERAN, wajibPeran, type Peran } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };

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
  const [{ data: posyandu }, { data: penugasan }, { data: profil }] = await Promise.all([
    supabase.from("posyandu").select("id, nama, alamat, aktif, puskesmas(nama)").order("nama"),
    supabase.from("kader_posyandu").select("posyandu_id, profiles(nama)"),
    supabase.from("profiles").select("peran"),
  ]);
  const jumlah = (profil ?? []).reduce<Record<string, number>>((s, p) => ({ ...s, [p.peran]: (s[p.peran] ?? 0) + 1 }), {});

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Pengelolaan sistem</h1>
      <p className="mt-1 text-sm text-redup">
        Admin mengelola wilayah, posyandu, dan akun. Sesuai kebijakan privasi, admin tidak dapat melihat data kesehatan anak.
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
      <p className="mt-4 text-sm text-redup">Penambahan posyandu dan akun kader/bidan saat ini dilakukan oleh tim melalui panel Supabase.</p>
    </div>
  );
}
