import { z } from "zod";
import { hitungStatusGizi, umurHari, UMUR_MAKS_HARI } from "@/lib/gizi";

const tanggal = z.iso.date({ error: "Format tanggal harus YYYY-MM-DD" });

const Skema = z
  .object({
    tglLahir: tanggal,
    tglUkur: tanggal,
    jenisKelamin: z.enum(["L", "P"], { error: "Pilih jenis kelamin" }),
    beratKg: z.number({ error: "Isi berat badan" }).min(0.5, "Berat minimal 0,5 kg").max(40, "Berat maksimal 40 kg"),
    tinggiCm: z.number({ error: "Isi panjang/tinggi badan" }).min(35, "Panjang minimal 35 cm").max(130, "Tinggi maksimal 130 cm"),
    caraUkur: z.enum(["terlentang", "berdiri"], { error: "Pilih cara ukur" }),
  })
  .superRefine((d, ctx) => {
    const hari = umurHari(d.tglLahir, d.tglUkur);
    if (hari < 0) ctx.addIssue({ code: "custom", path: ["tglUkur"], message: "Tanggal ukur sebelum tanggal lahir" });
    else if (hari > UMUR_MAKS_HARI)
      ctx.addIssue({ code: "custom", path: ["tglLahir"], message: "Standar WHO hanya untuk anak 0–60 bulan" });
  });

/**
 * POST /api/v1/status-gizi — hitung status gizi dari satu pengukuran.
 * Publik dan tanpa penyimpanan: dipakai kalkulator di halaman depan.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return galat(400, "INVALID_JSON", "Body harus berupa JSON");
  }

  const hasil = Skema.safeParse(body);
  if (!hasil.success) {
    const fields: Record<string, string> = {};
    for (const issue of hasil.error.issues) {
      const key = String(issue.path[0] ?? "body");
      fields[key] ??= issue.message;
    }
    return galat(400, "VALIDATION_ERROR", "Data pengukuran tidak valid", fields);
  }

  return Response.json({ data: hitungStatusGizi(hasil.data) });
}

function galat(status: number, code: string, message: string, fields?: Record<string, string>) {
  return Response.json({ error: { code, message, ...(fields && { fields }) } }, { status });
}
