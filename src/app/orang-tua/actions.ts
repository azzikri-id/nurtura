"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { wajibPeran } from "@/lib/auth";

export type StatusKlaim = { galat?: string };

/** Menautkan akun orang tua ke data anak memakai kode undangan dari kader. */
export async function klaimKode(_: StatusKlaim, form: FormData): Promise<StatusKlaim> {
  await wajibPeran("orang_tua");
  const kode = String(form.get("kode") ?? "").trim().toUpperCase();
  if (!/^[0-9A-F]{8}$/.test(kode)) return { galat: "Kode undangan terdiri dari 8 huruf/angka, mis. A747D69E." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("klaim_kode_undangan", { p_kode: kode });
  if (error) return { galat: "Kode tidak ditemukan atau sudah dipakai. Tanyakan ke kader posyandu Anda." };
  revalidatePath("/orang-tua");
  return {};
}
