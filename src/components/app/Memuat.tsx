/** Kerangka sederhana selama data per pengguna dimuat. */
export function Memuat({ teks = "Memuat data…" }: { teks?: string }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10" role="status" aria-live="polite">
      <div className="h-7 w-48 animate-pulse rounded bg-garis" />
      <div className="mt-6 h-40 animate-pulse rounded-xl bg-white" />
      <p className="sr-only">{teks}</p>
    </div>
  );
}
