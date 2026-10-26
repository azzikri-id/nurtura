import type { Peran } from "@/lib/auth";

/**
 * Akun demo untuk juri. Datanya fiktif dan bisa direset dengan `npm run seed`,
 * jadi kata sandinya sengaja dibuka di halaman masuk.
 */
export const PASSWORD_DEMO = "NurturaDemo2026";

export const AKUN_DEMO: { peran: Peran; email: string; nama: string; keterangan: string }[] = [
  { peran: "kader", email: "kader.mawar@example.com", nama: "Sri Wahyuni", keterangan: "Posyandu Mawar" },
  { peran: "bidan", email: "bidan@example.com", nama: "Bidan Ani Lestari", keterangan: "Puskesmas Sukamaju" },
  { peran: "orang_tua", email: "orangtua@example.com", nama: "Rina Santoso", keterangan: "Ibu dari Budi" },
];
