"use client";

import { useState } from "react";
import type { StatusGizi } from "@/lib/gizi";
import { SkalaZ, warnaTeks } from "@/components/SkalaZ";
import { CONTOH_PENGUKURAN } from "./contoh";

type Form = {
  tglLahir: string;
  tglUkur: string;
  jenisKelamin: "L" | "P";
  beratKg: string;
  tinggiCm: string;
  caraUkur: "terlentang" | "berdiri";
};

// Terisi anak contoh dari kartu hero, sehingga hasilnya langsung terlihat.
const CONTOH: Form = {
  ...CONTOH_PENGUKURAN,
  beratKg: String(CONTOH_PENGUKURAN.beratKg),
  tinggiCm: String(CONTOH_PENGUKURAN.tinggiCm),
};

const INDIKATOR = [
  { key: "bbu", nama: "Berat badan menurut umur", singkat: "BB/U" },
  { key: "tbu", nama: "Panjang/tinggi badan menurut umur", singkat: "PB/U · TB/U" },
  { key: "bbtb", nama: "Berat badan menurut panjang/tinggi", singkat: "BB/PB · BB/TB" },
] as const;

const angka = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(",", ".")));
const formatZ = (z: number) => z.toFixed(2).replace(".", ",").replace("-", "−");

/** `hasilAwal` dihitung di server untuk data contoh, agar panel hasil tidak kosong saat pertama dibuka. */
export function CobaHitung({ hasilAwal }: { hasilAwal: StatusGizi }) {
  const [form, setForm] = useState<Form>(CONTOH);
  const [hasil, setHasil] = useState<StatusGizi | null>(hasilAwal);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [memuat, setMemuat] = useState(false);

  const ubah = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function hitung(e: React.FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat({});
    try {
      const res = await fetch("/api/v1/status-gizi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, beratKg: angka(form.beratKg), tinggiCm: angka(form.tinggiCm) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setHasil(null);
        setGalat(json.error?.fields ?? { umum: json.error?.message ?? "Terjadi kesalahan" });
        return;
      }
      setHasil(json.data);
    } catch {
      setGalat({ umum: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setMemuat(false);
    }
  }

  const label = "block text-sm font-semibold text-tinta";
  const input =
    "mt-1.5 w-full rounded-lg border border-garis bg-white px-3 py-2.5 text-tinta outline-none transition-colors focus:border-langit focus:ring-2 focus:ring-langit/20 aria-[invalid=true]:border-bahaya";
  const pesan = (k: string) =>
    galat[k] && <p id={`galat-${k}`} className="mt-1 text-sm text-bahaya">{galat[k]}</p>;
  const aria = (k: string) => ({ "aria-invalid": !!galat[k], "aria-describedby": galat[k] ? `galat-${k}` : undefined });
  const terkoreksi = hasil && Math.abs(hasil.tinggiTerkoreksiCm - (angka(form.tinggiCm) ?? 0)) > 0.01;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <form onSubmit={hitung} noValidate className="rounded-2xl border border-garis bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tglLahir" className={label}>Tanggal lahir</label>
            <input id="tglLahir" type="date" className={input} value={form.tglLahir}
              onChange={(e) => ubah("tglLahir", e.target.value)} {...aria("tglLahir")} />
            {pesan("tglLahir")}
          </div>
          <div>
            <label htmlFor="tglUkur" className={label}>Tanggal ukur</label>
            <input id="tglUkur" type="date" className={input} value={form.tglUkur}
              onChange={(e) => ubah("tglUkur", e.target.value)} {...aria("tglUkur")} />
            {pesan("tglUkur")}
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className={label}>Jenis kelamin</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {([["L", "Laki-laki"], ["P", "Perempuan"]] as const).map(([v, t]) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-garis px-3 py-2.5 text-tinta has-[:checked]:border-langit has-[:checked]:bg-latar">
                <input type="radio" name="jk" value={v} checked={form.jenisKelamin === v}
                  onChange={() => ubah("jenisKelamin", v)} className="accent-langit" />
                {t}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="beratKg" className={label}>Berat badan (kg)</label>
            <input id="beratKg" type="text" inputMode="decimal" className={input} value={form.beratKg}
              onChange={(e) => ubah("beratKg", e.target.value)} {...aria("beratKg")} />
            {pesan("beratKg")}
          </div>
          <div>
            <label htmlFor="tinggiCm" className={label}>Panjang/tinggi badan (cm)</label>
            <input id="tinggiCm" type="text" inputMode="decimal" className={input} value={form.tinggiCm}
              onChange={(e) => ubah("tinggiCm", e.target.value)} {...aria("tinggiCm")} />
            {pesan("tinggiCm")}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="caraUkur" className={label}>Cara ukur</label>
          <select id="caraUkur" className={input} value={form.caraUkur}
            onChange={(e) => ubah("caraUkur", e.target.value as Form["caraUkur"])}>
            <option value="terlentang">Terlentang (panjang badan)</option>
            <option value="berdiri">Berdiri (tinggi badan)</option>
          </select>
        </div>

        {pesan("umum")}
        <button type="submit" disabled={memuat}
          className="mt-6 w-full rounded-lg bg-langit-tua px-5 py-3 font-semibold text-white transition-colors hover:bg-tinta disabled:opacity-60">
          {memuat ? "Menghitung…" : "Hitung status gizi"}
        </button>
        <p className="mt-3 text-xs text-redup">Data yang Anda masukkan tidak disimpan.</p>
      </form>

      <div aria-live="polite" className="rounded-2xl border border-garis bg-white p-6">
        {!hasil ? (
          <div className="flex h-full flex-col justify-center text-redup">
            <p className="font-semibold text-tinta">Belum ada hasil</p>
            <p className="mt-1 text-sm">Perbaiki isian yang ditandai, lalu tekan “Hitung status gizi”.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-redup">
              Umur saat diukur <span className="font-semibold text-tinta">{hasil.umurBulan.toFixed(1).replace(".", ",")} bulan</span>
              {terkoreksi && (
                <> · panjang dikoreksi menjadi <span className="font-semibold text-tinta">{String(hasil.tinggiTerkoreksiCm).replace(".", ",")} cm</span> sesuai cara ukur</>
              )}
            </p>
            <ul className="mt-4 divide-y divide-garis border-y border-garis">
              {INDIKATOR.map(({ key, nama, singkat }) => {
                const h = hasil[key];
                return (
                  <li key={key} className="py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-tinta">
                        {nama} <span className="text-xs font-medium text-redup">({singkat})</span>
                      </p>
                      <p className="text-lg font-bold tabular-nums text-tinta">{h ? `${formatZ(h.z)} SD` : "—"}</p>
                    </div>
                    {h ? (
                      <>
                        <p className={`mt-1 font-semibold ${warnaTeks[h.kategori.tingkat]}`}>{h.kategori.label}</p>
                        <div className="mt-2">
                          <SkalaZ indikator={key} z={h.z} />
                          <div className="relative mt-1 h-3.5 text-[10px] tabular-nums text-redup" aria-hidden>
                            {[-3, -2, 0, 2, 3].map((t) => (
                              <span key={t} className="absolute -translate-x-1/2" style={{ left: `${((t + 4) / 8) * 100}%` }}>
                                {t > 0 ? `+${t}` : t === 0 ? "0" : `−${-t}`}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-redup">{h.kategori.penjelasan}</p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-redup">Di luar cakupan tabel WHO untuk ukuran ini.</p>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-redup">
              Hasil ini adalah skrining, bukan diagnosis. Keputusan klinis tetap pada bidan atau dokter.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
