import Anthropic from "@anthropic-ai/sdk";

/** Satu-satunya tempat nama model ditulis, agar mudah diganti. */
export const MODEL = "claude-sonnet-5-5";

/**
 * Fallback sisi server bila model menolak (kategori keamanan tertentu). Untuk topik gizi anak
 * hampir tidak pernah terjadi, tapi dipasang sesuai rekomendasi Anthropic.
 */
export const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

let klien: Anthropic | null = null;

/** Klien Claude (kunci dari ANTHROPIC_API_KEY, hanya di server). */
export function claude(): Anthropic {
  klien ??= new Anthropic();
  return klien;
}

export class GalatAI extends Error {
  constructor(public kode: "ditolak" | "sibuk" | "gagal", pesan: string) {
    super(pesan);
  }
}

/** Ubah galat SDK menjadi pesan yang bisa ditampilkan ke pengguna. */
export function terjemahkanGalat(e: unknown): GalatAI {
  if (e instanceof GalatAI) return e;
  if (e instanceof Anthropic.RateLimitError) return new GalatAI("sibuk", "Asisten sedang sibuk. Coba lagi beberapa saat lagi.");
  if (e instanceof Anthropic.APIError) return new GalatAI("gagal", "Asisten tidak dapat dihubungi saat ini.");
  return new GalatAI("gagal", "Terjadi kesalahan pada asisten.");
}
