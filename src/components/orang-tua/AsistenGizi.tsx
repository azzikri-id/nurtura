"use client";

import { useState } from "react";

type Jawaban = { pertanyaan: string; jawaban: string; bahaya: boolean; sumber: { nomor: number; topik: string; sumber: string }[] };

const CONTOH = ["Anak saya susah makan, harus bagaimana?", "Lauk apa yang murah tapi bergizi?", "Berapa kali makan sehari untuk umurnya?"];

export function AsistenGizi({ anakId, namaPanggilan }: { anakId: string; namaPanggilan: string }) {
  const [teks, setTeks] = useState("");
  const [riwayat, setRiwayat] = useState<Jawaban[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  async function tanya(pertanyaan: string) {
    if (!pertanyaan.trim() || memuat) return;
    setMemuat(true);
    setGalat("");
    try {
      const res = await fetch("/api/v1/ai/tanya", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anakId, pertanyaan }),
      });
      const json = await res.json();
      if (!res.ok) return setGalat(json.error?.message ?? "Terjadi kesalahan.");
      setRiwayat((r) => [{ pertanyaan, ...json.data }, ...r]);
      setTeks("");
    } catch {
      setGalat("Tidak dapat terhubung. Periksa koneksi internet Anda.");
    } finally {
      setMemuat(false);
    }
  }

  return (
    <section className="rounded-xl border border-garis bg-white p-5">
      <h2 className="text-lg font-bold text-tinta">Tanya soal makan {namaPanggilan}</h2>
      <p className="text-sm text-redup">Jawaban disusun dari pedoman gizi WHO dan Kemenkes, disesuaikan dengan umur dan status gizi anak.</p>

      <form onSubmit={(e) => { e.preventDefault(); tanya(teks); }} className="mt-4">
        <label htmlFor="pertanyaan" className="sr-only">Pertanyaan</label>
        <textarea id="pertanyaan" rows={2} maxLength={500} value={teks} onChange={(e) => setTeks(e.target.value)}
          placeholder="Tulis pertanyaan dengan bahasa sehari-hari…"
          className="w-full rounded-lg border border-garis px-3 py-2.5 text-tinta outline-none focus:border-langit focus:ring-2 focus:ring-langit/20" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-redup">
            Contoh:{" "}
            {CONTOH.map((c, i) => (
              <span key={c}>
                <button type="button" onClick={() => tanya(c)} disabled={memuat}
                  className="text-langit-tua underline decoration-langit/30 underline-offset-2 hover:decoration-langit disabled:opacity-60">{c}</button>
                {i < CONTOH.length - 1 && " · "}
              </span>
            ))}
          </p>
          <button type="submit" disabled={memuat || !teks.trim()}
            className="rounded-lg bg-langit px-4 py-2 text-sm font-semibold text-white hover:bg-langit-tua disabled:opacity-60">
            {memuat ? "Mencari jawaban…" : "Tanyakan"}
          </button>
        </div>
      </form>
      {galat && <p role="alert" className="mt-3 text-sm text-bahaya">{galat}</p>}

      <div aria-live="polite" className="mt-4 space-y-4">
        {riwayat.map((r, i) => (
          <article key={i} className="border-t border-garis pt-4">
            <p className="text-sm font-semibold text-tinta">{r.pertanyaan}</p>
            <p className={`mt-2 whitespace-pre-line text-sm leading-relaxed ${r.bahaya ? "rounded-lg bg-bahaya-latar px-3 py-2 font-semibold text-bahaya" : "text-tinta"}`}>
              {r.jawaban}
            </p>
            {r.sumber.length > 0 && (
              <ol className="mt-2 space-y-0.5 text-xs text-redup">
                {r.sumber.map((s) => <li key={s.nomor}>[{s.nomor}] {s.topik} — {s.sumber}</li>)}
              </ol>
            )}
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-redup">Bukan pengganti konsultasi. Untuk keluhan kesehatan, hubungi bidan atau puskesmas. Nama dan identitas tidak dikirim ke asisten.</p>
    </section>
  );
}
