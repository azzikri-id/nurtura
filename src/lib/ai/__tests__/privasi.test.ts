import { describe, expect, it } from "vitest";
import { redaksi, tandaBahaya } from "../privasi";

describe("redaksi identitas", () => {
  it("menghapus NIK, email, dan nomor HP", () => {
    const t = redaksi("NIK 3404015003260001, email rina@contoh.id, HP 0812-3456-7890 atau +6281234567890");
    expect(t).not.toMatch(/3404015003260001|rina@contoh\.id|0812|81234567890/);
    expect(t).toContain("[NIK]");
    expect(t).toContain("[email]");
    expect(t).toContain("[nomor HP]");
  });
  it("menghapus nama anak dan orang tua yang diketahui", () => {
    expect(redaksi("Budi susah makan, kata Rina", ["Budi Santoso", "Rina Santoso"])).toBe("[nama] susah makan, kata [nama]");
  });
  it("tidak mengubah pertanyaan tanpa identitas", () => {
    expect(redaksi("anak 10 bulan susah makan sayur")).toBe("anak 10 bulan susah makan sayur");
  });
});

describe("tanda bahaya", () => {
  it.each([
    ["anak saya kejang tadi malam", "kejang"],
    ["napasnya cepat dan sesak", "sesak napas"],
    ["diare berdarah sejak pagi", "diare berdarah"],
    ["demam 39,5 sudah 2 hari", "demam tinggi"],
    ["tidak mau menyusu sama sekali", "tidak bisa minum atau menyusu"],
  ])("%s → %s", (teks, tanda) => {
    expect(tandaBahaya(teks)).toContain(tanda);
  });
  it("pertanyaan gizi biasa tidak dianggap bahaya", () => {
    expect(tandaBahaya("anak 1 tahun susah makan, harus bagaimana?")).toEqual([]);
    expect(tandaBahaya("berapa kali makan sehari untuk anak 9 bulan")).toEqual([]);
  });
});
