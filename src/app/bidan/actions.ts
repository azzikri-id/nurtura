"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { wajibPeran } from "@/lib/auth";

export type StatusTindak = { galat?: string; berhasil?: boolean };

const Skema = z.object({
  status: z.enum(["ditindaklanjuti", "selesai"]),
  catatan: z.string().trim().min(3, "Tuliskan catatan tindak lanjut").max(1000),
});

/** Bidan menandai peringatan ditindaklanjuti/selesai beserta catatannya. RLS membatasi ke wilayahnya. */
export async function tindakLanjut(id: string, _: StatusTindak, form: FormData): Promise<StatusTindak> {
  const bidan = await wajibPeran("bidan");
  const hasil = Skema.safeParse({ status: form.get("status"), catatan: form.get("catatan") });
  if (!hasil.success) return { galat: hasil.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("peringatan")
    .update({
      status: hasil.data.status, catatan_tindak_lanjut: hasil.data.catatan,
      ditangani_oleh: bidan.id, diperbarui_pada: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) return { galat: "Gagal menyimpan. Peringatan ini mungkin bukan di wilayah Anda." };

  await supabase.from("audit_log").insert({ user_id: bidan.id, aksi: "ubah", tabel: "peringatan", record_id: id });
  revalidatePath("/bidan");
  return { berhasil: true };
}
