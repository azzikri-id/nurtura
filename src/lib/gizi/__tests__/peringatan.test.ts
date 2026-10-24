import { describe, expect, it } from "vitest";
import { cekKewajaran, cekPeringatan, kbmGram, naikAtauTidak, type Titik } from "../peringatan";

const titik = (umurHari: number, beratKg: number, extra: Partial<Titik> = {}): Titik => ({
  tglUkur: "2026-01-01", umurHari, beratKg, tinggiCm: 70, zBBU: 0, zTBU: 0, zBBTB: 0,
  tingkatBBU: "normal", tingkatTBU: "normal", tingkatBBTB: "normal", ...extra,
});

describe("KBM dan N/T", () => {
  it("mengikuti tabel KBM", () => {
    expect(kbmGram(1)).toBe(800);
    expect(kbmGram(2)).toBe(900);
    expect(kbmGram(6)).toBe(400);
    expect(kbmGram(11)).toBe(200);
    expect(kbmGram(30)).toBeNull();
  });
  it("bayi: N bila kenaikan ≥ KBM, T bila kurang", () => {
    expect(naikAtauTidak(titik(270, 8.0), titik(300, 8.3))).toBe("N"); // +300 g pada 9–10 bulan
    expect(naikAtauTidak(titik(270, 8.0), titik(300, 8.2))).toBe("T");
  });
  it("≥ 12 bulan: T hanya bila berat tetap atau turun", () => {
    expect(naikAtauTidak(titik(800, 12.0), titik(830, 12.1))).toBe("N");
    expect(naikAtauTidak(titik(800, 12.0), titik(830, 12.0))).toBe("T");
    expect(naikAtauTidak(titik(800, 12.0), titik(830, 11.9))).toBe("T");
  });
  it("tidak dinilai bila jaraknya bukan bulan berurutan", () => {
    expect(naikAtauTidak(titik(300, 8), titik(400, 8))).toBeNull();
  });
});

describe("peringatan dini", () => {
  it("2T: berat tidak naik dua bulan berturut-turut", () => {
    const p = cekPeringatan([titik(365, 8.5), titik(396, 8.5), titik(426, 8.5)]);
    expect(p.map((x) => x.jenis)).toContain("bb_tidak_naik_2x");
  });
  it("satu kali T belum memicu peringatan", () => {
    const p = cekPeringatan([titik(365, 8.0), titik(396, 8.5), titik(426, 8.5)]);
    expect(p.map((x) => x.jenis)).not.toContain("bb_tidak_naik_2x");
  });
  it("z-score TB/U turun > 0,5 SD walau masih normal", () => {
    const p = cekPeringatan([
      titik(300, 8, { zTBU: -0.5 }), titik(330, 8.4, { zTBU: -0.9 }), titik(360, 8.8, { zTBU: -1.2 }),
    ]);
    expect(p.find((x) => x.jenis === "z_turun")?.pesan).toContain("TB/U");
  });
  it("kategori pendek → waspada, sangat pendek → bahaya", () => {
    expect(cekPeringatan([titik(300, 8, { tingkatTBU: "waspada" })])[0]).toMatchObject({ jenis: "kategori_berisiko", tingkat: "waspada" });
    expect(cekPeringatan([titik(300, 8, { tingkatTBU: "bahaya" })])[0]).toMatchObject({ tingkat: "bahaya" });
  });
  it("anak yang tumbuh normal tidak mendapat peringatan", () => {
    expect(cekPeringatan([titik(300, 8), titik(330, 8.4), titik(360, 8.8)])).toEqual([]);
  });
});

describe("deteksi kesalahan input", () => {
  it("berat berubah > 30%", () => {
    expect(cekKewajaran(titik(330, 12), titik(300, 8))[0].kolom).toBe("beratKg");
  });
  it("tinggi berkurang > 1 cm", () => {
    expect(cekKewajaran(titik(330, 8.3, { tinggiCm: 68 }), titik(300, 8, { tinggiCm: 70 }))[0].kolom).toBe("tinggiCm");
  });
  it("z-score di luar batas wajar WHO", () => {
    expect(cekKewajaran(titik(330, 30, { zBBU: 7 }), null).length).toBeGreaterThan(0);
  });
  it("tanggal ukur tidak boleh sebelum pengukuran terakhir", () => {
    expect(cekKewajaran(titik(300, 8), titik(300, 8))[0].kolom).toBe("umum");
  });
  it("data wajar lolos", () => {
    expect(cekKewajaran(titik(330, 8.3, { tinggiCm: 71 }), titik(300, 8, { tinggiCm: 70 }))).toEqual([]);
  });
});
