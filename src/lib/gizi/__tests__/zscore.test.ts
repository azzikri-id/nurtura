import { describe, expect, it } from "vitest";
import fixture from "./who-sd-fixture.json";
import {
  hitungStatusGizi,
  kategoriBBTB,
  kategoriBBU,
  kategoriTBU,
  koreksiPanjang,
  umurHari,
  zBBTB,
  zBBU,
  zTBU,
  type JenisKelamin,
} from "../index";

type Titik = { x: number } & Record<"SD3neg" | "SD2neg" | "SD1neg" | "SD0" | "SD1" | "SD2" | "SD3", number>;
const SD: [keyof Titik, number][] = [
  ["SD3neg", -3], ["SD2neg", -2], ["SD1neg", -1], ["SD0", 0], ["SD1", 1], ["SD2", 2], ["SD3", 3],
];
const JK: [string, JenisKelamin][] = [["1", "L"], ["2", "P"]];
const titik = (ind: keyof typeof fixture, sex: string) =>
  (fixture[ind] as Record<string, Titik[]>)[sex];

// Kunci jawaban: nilai -3 SD s.d. +3 SD yang diterbitkan WHO (dibulatkan 3 desimal di tabel WHO).
describe("z-score cocok dengan tabel SD resmi WHO", () => {
  for (const [sex, jk] of JK) {
    it(`BB/U ${jk}`, () => {
      for (const t of titik("wfa", sex))
        for (const [col, z] of SD) expect(zBBU(t[col], t.x, jk)).toBeCloseTo(z, 2);
    });
    it(`PB/U & TB/U ${jk}`, () => {
      for (const t of titik("lhfa", sex))
        for (const [col, z] of SD) expect(zTBU(t[col], t.x, jk)).toBeCloseTo(z, 2);
    });
    it(`BB/PB ${jk} (umur < 24 bulan)`, () => {
      for (const t of titik("wfl", sex))
        for (const [col, z] of SD) expect(zBBTB(t[col], t.x, 300, jk)).toBeCloseTo(z, 2);
    });
    it(`BB/TB ${jk} (umur ≥ 24 bulan)`, () => {
      for (const t of titik("wfh", sex))
        for (const [col, z] of SD) expect(zBBTB(t[col], t.x, 1000, jk)).toBeCloseTo(z, 2);
    });
  }
});

describe("z-score terbatas di luar ±3 SD (indikator berat)", () => {
  it("memakai jarak SD2–SD3 sebagai satuan", () => {
    for (const t of titik("wfa", "1")) {
      expect(zBBU(t.SD3 + 0.5 * (t.SD3 - t.SD2), t.x, "L")).toBeCloseTo(3.5, 2);
      expect(zBBU(t.SD3neg - 0.5 * (t.SD2neg - t.SD3neg), t.x, "L")).toBeCloseTo(-3.5, 2);
    }
  });
});

describe("contoh kasus", () => {
  it("anak laki-laki 12 bulan (365 hari), berat 7,741 kg = -2 SD BB/U", () => {
    expect(zBBU(7.741, 365, "L")).toBeCloseTo(-2, 2);
  });
  it("panjang badan di antara kelipatan 0,1 cm diinterpolasi", () => {
    const a = zBBTB(8, 70.0, 300, "P")!, b = zBBTB(8, 70.1, 300, "P")!, c = zBBTB(8, 70.05, 300, "P")!;
    expect(c).toBeLessThan(a);
    expect(c).toBeGreaterThan(b);
  });
  it("di luar cakupan standar menghasilkan null", () => {
    expect(zBBU(10, 1857, "L")).toBeNull();
    expect(zBBU(10, -1, "L")).toBeNull();
    expect(zBBTB(2, 44.9, 10, "L")).toBeNull();
    expect(zBBTB(30, 120.1, 1000, "L")).toBeNull();
  });
});

describe("umur dan koreksi cara ukur", () => {
  it("menghitung umur dalam hari", () => {
    expect(umurHari("2025-10-18", "2026-10-18")).toBe(365);
    expect(umurHari("2024-02-29", "2024-03-01")).toBe(1);
    expect(umurHari("2026-10-18T23:00:00", "2026-10-19")).toBe(1);
  });
  it("koreksi ±0,7 cm bila cara ukur tidak sesuai umur", () => {
    expect(koreksiPanjang(70, 300, "berdiri")).toBeCloseTo(70.7);
    expect(koreksiPanjang(70, 300, "terlentang")).toBe(70);
    expect(koreksiPanjang(90, 800, "terlentang")).toBeCloseTo(89.3);
    expect(koreksiPanjang(90, 800, "berdiri")).toBe(90);
    expect(koreksiPanjang(85, 730, "berdiri")).toBeCloseTo(85.7);
    expect(koreksiPanjang(85, 731, "terlentang")).toBeCloseTo(84.3);
  });
});

describe("kategori Permenkes No. 2 Tahun 2020", () => {
  it("BB/U", () => {
    expect(kategoriBBU(-3.01).label).toBe("Berat badan sangat kurang");
    expect(kategoriBBU(-3).label).toBe("Berat badan kurang");
    expect(kategoriBBU(-2).label).toBe("Berat badan normal");
    expect(kategoriBBU(1).label).toBe("Berat badan normal");
    expect(kategoriBBU(1.01).label).toBe("Risiko berat badan lebih");
  });
  it("PB/U & TB/U", () => {
    expect(kategoriTBU(-3.01).label).toBe("Sangat pendek");
    expect(kategoriTBU(-2.01).label).toBe("Pendek");
    expect(kategoriTBU(-2).label).toBe("Normal");
    expect(kategoriTBU(3).label).toBe("Normal");
    expect(kategoriTBU(3.01).label).toBe("Tinggi");
  });
  it("BB/PB & BB/TB", () => {
    expect(kategoriBBTB(-3.01).label).toBe("Gizi buruk");
    expect(kategoriBBTB(-2.5).label).toBe("Gizi kurang");
    expect(kategoriBBTB(0).label).toBe("Gizi baik (normal)");
    expect(kategoriBBTB(1.5).label).toBe("Berisiko gizi lebih");
    expect(kategoriBBTB(2.5).label).toBe("Gizi lebih");
    expect(kategoriBBTB(3.01).label).toBe("Obesitas");
  });
});

describe("hitungStatusGizi", () => {
  it("menggabungkan umur, koreksi, z-score, dan kategori", () => {
    const s = hitungStatusGizi({
      tglLahir: "2025-10-18", tglUkur: "2026-10-18", jenisKelamin: "L",
      beratKg: 7.741, tinggiCm: 75, caraUkur: "berdiri",
    });
    expect(s.umurHari).toBe(365);
    expect(s.umurBulan).toBeCloseTo(11.99, 2);
    expect(s.tinggiTerkoreksiCm).toBe(75.7);
    expect(s.bbu?.z).toBe(-2);
    expect(s.bbu?.kategori.label).toBe("Berat badan normal");
    expect(s.tbu).not.toBeNull();
    expect(s.bbtb).not.toBeNull();
  });
  it("menolak umur di luar 0–60 bulan", () => {
    expect(() => hitungStatusGizi({
      tglLahir: "2020-01-01", tglUkur: "2026-10-18", jenisKelamin: "P",
      beratKg: 15, tinggiCm: 100, caraUkur: "berdiri",
    })).toThrow(RangeError);
  });
});
