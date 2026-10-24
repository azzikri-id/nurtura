"use client";

import { useState } from "react";
import type { HasilValidasi } from "@/lib/gizi/menu";

type Hasil = { menu: HasilValidasi[]; disembunyikan: { nama: string; alasan: string[] }[]; catatan: string };
const WAKTU: Record<string, string> = { pagi: "Pagi", siang: "Siang", sore: "Sore", selingan: "Selingan" };
const TEKSTUR: Record<string, string> = { lumat: "lumat", lembik: "lembik", cincang: "cincang", keluarga: "makanan keluarga" };

export function MenuMpasi({ anakId, bahan }: { anakId: string; bahan: { nama: string; proteinHewani: boolean }[] }) {
  const [pilihan, setPilihan] = useState<string[]>(["Telur ayam", "Tempe", "Beras", "Bayam", "Wortel"].filter((n) => bahan.some((b) => b.nama === n)));
  const [budget, setBudget] = useState("15000");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  const ubah = (nama: string) => setPilihan((p) => (p.includes(nama) ? p.filter((x) => x !== nama) : [...p, nama]));

  async function susun(e: React.FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat("");
    try {
      const nilaiBudget = Number(budget.replace(/\D/g, ""));
      const res = await fetch("/api/v1/ai/menu", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anakId, bahan: pilihan, ...(nilaiBudget ? { budget: nilaiBudget } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) return setGalat(json.error?.message ?? "Terjadi kesalahan.");
      setHasil(json.data);
    } catch {
      setGalat("Tidak dapat terhubung. Periksa koneksi internet Anda.");
    } finally {
      setMemuat(false);
    }
  }

  const kelompok = [
    { judul: "Lauk hewani", daftar: bahan.filter((b) => b.proteinHewani) },
    { judul: "Bahan lain", daftar: bahan.filter((b) => !b.proteinHewani) },
  ];

  return (
    <section className="rounded-xl border border-garis bg-white p-5">
      <h2 className="text-lg font-bold text-tinta">Menu sehari dari bahan di rumah</h2>
      <p className="text-sm text-redup">Pilih bahan yang ada. Setiap menu diperiksa aturan keamanan (tekstur sesuai umur, tanpa madu dan garam untuk bayi, protein hewani) sebelum ditampilkan.</p>

      <form onSubmit={susun} className="mt-4 space-y-4">
        {kelompok.map((k) => (
          <fieldset key={k.judul}>
            <legend className="text-xs font-semibold uppercase tracking-wide text-redup">{k.judul}</legend>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {k.daftar.map((b) => (
                <label key={b.nama} className="flex items-center gap-1.5 text-sm text-tinta">
                  <input type="checkbox" checked={pilihan.includes(b.nama)} onChange={() => ubah(b.nama)} className="accent-langit" />
                  {b.nama}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="budget" className="block text-sm font-semibold text-tinta">Budget sehari (Rp)</label>
            <input id="budget" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)}
              className="mt-1.5 w-40 rounded-lg border border-garis px-3 py-2 text-tinta outline-none focus:border-langit focus:ring-2 focus:ring-langit/20" />
          </div>
          <button type="submit" disabled={memuat || !pilihan.length}
            className="rounded-lg bg-langit px-4 py-2.5 text-sm font-semibold text-white hover:bg-langit-tua disabled:opacity-60">
            {memuat ? "Menyusun menu…" : "Susun menu"}
          </button>
        </div>
      </form>
      {galat && <p role="alert" className="mt-3 text-sm text-bahaya">{galat}</p>}

      {hasil && (
        <div aria-live="polite" className="mt-5 border-t border-garis pt-5">
          {hasil.menu.length === 0 && <p className="text-sm text-tinta">{hasil.catatan || "Belum ada menu yang lolos pemeriksaan. Coba pilih bahan lain."}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {hasil.menu.map(({ menu: m, catatan }) => (
              <article key={m.nama} className="rounded-lg border border-garis p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-langit-tua">{WAKTU[m.waktu]} · {TEKSTUR[m.tekstur]}</p>
                <h3 className="mt-1 font-bold text-tinta">{m.nama}</h3>
                <ul className="mt-2 text-sm text-tinta">
                  {m.bahan.map((b) => <li key={b.nama}>{b.nama} <span className="text-redup">— {b.takaran}</span></li>)}
                </ul>
                <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm text-redup">
                  {m.caraMasak.map((c) => <li key={c}>{c}</li>)}
                </ol>
                <p className="mt-2 text-sm text-tinta">{m.alasan}</p>
                <p className="mt-1 text-xs text-redup">Perkiraan Rp{m.perkiraanBiaya.toLocaleString("id-ID")}</p>
                {catatan.map((c) => <p key={c} className="mt-1 text-xs text-waspada">{c}</p>)}
              </article>
            ))}
          </div>
          {hasil.disembunyikan.length > 0 && (
            <p className="mt-3 text-xs text-redup">
              {hasil.disembunyikan.length} menu disembunyikan karena tidak lolos pemeriksaan: {hasil.disembunyikan.map((d) => `${d.nama} (${d.alasan.join(" ")})`).join("; ")}
            </p>
          )}
          {hasil.catatan && hasil.menu.length > 0 && <p className="mt-3 text-sm text-redup">{hasil.catatan}</p>}
        </div>
      )}
    </section>
  );
}
