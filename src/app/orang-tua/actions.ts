"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
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

export type StatusHapus = { galat?: string };

/**
 * Orang tua menghapus data anak beserta keluarganya (hak hapus, UU PDP). Kepemilikan diperiksa
 * lewat RLS dengan sesi pengguna; penghapusan memakai klien admin karena RLS sengaja tidak
 * memberi hak DELETE langsung. Dinonaktifkan pada akun demo agar data contoh tetap utuh.
 */
export async function hapusDataAnak(anakId: string, namaAnak: string, _: StatusHapus, form: FormData): Promise<StatusHapus> {
  const ortu = await wajibPeran("orang_tua");
  if (String(form.get("konfirmasi") ?? "").trim().toLowerCase() !== namaAnak.split(" ")[0].toLowerCase()) {
    return { galat: `Ketik "${namaAnak.split(" ")[0]}" untuk mengonfirmasi.` };
  }
  if (ortu.email.endsWith("@example.com")) {
    return { galat: "Penghapusan dinonaktifkan pada akun demo agar data contoh tetap tersedia untuk pengunjung lain." };
  }
  const supabase = await createClient();
  const { data: anak } = await supabase
    .from("anak")
    .select("id, keluarga_id, keluarga!inner(orang_tua_user_id)")
    .eq("id", anakId)
    .eq("keluarga.orang_tua_user_id", ortu.id)
    .maybeSingle();
  if (!anak) return { galat: "Data anak tidak ditemukan atau bukan milik akun Anda." };

  const admin = createAdminClient();
  const { error } = await admin.from("keluarga").delete().eq("id", anak.keluarga_id);
  if (error) return { galat: "Gagal menghapus data. Coba lagi." };
  await admin.from("audit_log").insert({ user_id: ortu.id, aksi: "hapus", tabel: "keluarga", record_id: anak.keluarga_id });
  revalidatePath("/orang-tua");
  return {};
}
