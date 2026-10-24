import { describe, expect, it } from "vitest";
import { teksturSesuai, validasiMenu, type SatuMenu } from "../menu";

const BAHAN = [
  { nama: "Telur ayam", proteinHewani: true },
  { nama: "Hati ayam", proteinHewani: true },
  { nama: "Tempe", proteinHewani: false },
  { nama: "Beras", proteinHewani: false },
  { nama: "Bayam", proteinHewani: false },
  { nama: "Madu", proteinHewani: false },
];

const menu = (ubah: Partial<SatuMenu> = {}): SatuMenu => ({
  nama: "Bubur telur bayam", waktu: "pagi",
  bahan: [{ nama: "Beras", takaran: "2 sdm" }, { nama: "Telur ayam", takaran: "1 butir" }, { nama: "Bayam", takaran: "5 lembar" }],
  caraMasak: ["Masak beras menjadi bubur", "Tambahkan telur dan bayam", "Saring hingga lumat"],
  tekstur: "lumat", alasan: "Telur sumber protein hewani", perkiraanBiaya: 4000, ...ubah,
});

const opsi = { umurBulan: 7, perluProteinHewani: false, daftarBahan: BAHAN };

describe("tekstur sesuai umur", () => {
  it("6–8 bulan lumat, 9–11 lembik/cincang, ≥12 keluarga", () => {
    expect(teksturSesuai(7)).toEqual(["lumat"]);
    expect(teksturSesuai(10)).toEqual(["lembik", "cincang"]);
    expect(teksturSesuai(18)).toContain("keluarga");
  });
});

describe("validasi menu MPASI", () => {
  it("menu yang aman lolos", () => {
    expect(validasiMenu(menu(), opsi).ditolak).toEqual([]);
  });
  it("madu untuk anak < 12 bulan ditolak", () => {
    const h = validasiMenu(menu({ bahan: [...menu().bahan, { nama: "Madu", takaran: "1 sdt" }] }), opsi);
    expect(h.ditolak.join()).toMatch(/madu/i);
  });
  it("madu boleh untuk anak ≥ 12 bulan", () => {
    const h = validasiMenu(menu({ tekstur: "keluarga", bahan: [...menu().bahan, { nama: "Madu", takaran: "1 sdt" }] }), { ...opsi, umurBulan: 15 });
    expect(h.ditolak).toEqual([]);
  });
  it("garam/gula tambahan untuk anak < 12 bulan ditolak", () => {
    expect(validasiMenu(menu({ caraMasak: ["Masak bubur", "Beri sedikit garam"] }), opsi).ditolak.join()).toMatch(/garam/i);
  });
  it("tekstur tidak sesuai umur ditolak", () => {
    expect(validasiMenu(menu({ tekstur: "keluarga" }), opsi).ditolak.join()).toMatch(/tekstur/i);
  });
  it("tanpa protein hewani ditolak bila status gizi perlu perhatian", () => {
    const tanpaHewani = menu({ bahan: [{ nama: "Beras", takaran: "2 sdm" }, { nama: "Tempe", takaran: "1 potong" }] });
    expect(validasiMenu(tanpaHewani, { ...opsi, perluProteinHewani: true }).ditolak.join()).toMatch(/protein hewani/i);
    expect(validasiMenu(tanpaHewani, opsi).ditolak).toEqual([]);
  });
  it("makanan risiko tersedak ditolak", () => {
    expect(validasiMenu(menu({ bahan: [...menu().bahan, { nama: "Kacang tanah utuh", takaran: "5 butir" }] }), opsi).ditolak.join()).toMatch(/tersedak/i);
  });
  it("biaya di atas budget dan bahan di luar daftar hanya diberi catatan", () => {
    const h = validasiMenu(menu({ perkiraanBiaya: 20000, bahan: [...menu().bahan, { nama: "Salmon", takaran: "30 g" }] }), { ...opsi, budget: 10000 });
    expect(h.ditolak).toEqual([]);
    expect(h.catatan.join()).toMatch(/budget/);
    expect(h.catatan.join()).toMatch(/Salmon/);
  });
});
