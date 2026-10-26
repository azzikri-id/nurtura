import { describe, expect, it } from "vitest";
import { bersihkanPencarian } from "../pencarian";

describe("bersihkanPencarian", () => {
  it("mempertahankan nama orang Indonesia apa adanya", () => {
    for (const nama of ["Budi Santoso", "Siti Nurhaliza", "Ahmad-Fauzi", "Muhammad Rafi'i", "Dr. Anak", "Ni Luh Putu Ayu"]) {
      expect(bersihkanPencarian(nama)).toBe(nama);
    }
  });
  it("mempertahankan huruf non-Latin dan angka", () => {
    expect(bersihkanPencarian("Åsa Müller 2")).toBe("Åsa Müller 2");
  });
  it("membuang karakter yang dipakai pola serangan SQL", () => {
    expect(bersihkanPencarian("%' OR 1=1 --")).toBe("' OR 1 1 -");
    expect(bersihkanPencarian("Budi'; DROP TABLE anak;--")).toBe("Budi' DROP TABLE anak -");
    expect(bersihkanPencarian("a,b(c)d*e\\f;g=h<i>j%k_l")).not.toMatch(/[,()*\\;=<>%_]/);
  });
  it("memotong kata kunci yang terlalu panjang dan merapikan spasi", () => {
    expect(bersihkanPencarian("a".repeat(500))).toHaveLength(60);
    expect(bersihkanPencarian("  Budi    Santoso  ")).toBe("Budi Santoso");
  });
  it("mengosongkan masukan yang hanya berisi simbol", () => {
    expect(bersihkanPencarian("%%%;;;===")).toBe("");
  });
});
