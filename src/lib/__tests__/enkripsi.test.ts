import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { dekripsi, enkripsi } from "../enkripsi";

describe("enkripsi NIK", () => {
  beforeAll(() => {
    process.env.NIK_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  });
  it("bisa dibuka kembali dan tidak menyimpan teks asli", () => {
    const sandi = enkripsi("3404010101250001");
    expect(sandi).not.toContain("3404010101250001");
    expect(dekripsi(sandi)).toBe("3404010101250001");
  });
  it("hasil berbeda tiap kali (IV acak)", () => {
    expect(enkripsi("3404010101250001")).not.toBe(enkripsi("3404010101250001"));
  });
  it("menolak data yang diubah", () => {
    const [iv, tag, isi] = enkripsi("3404010101250001").split(".");
    const ubah = Buffer.from(isi, "base64");
    ubah[0] ^= 1;
    expect(() => dekripsi([iv, tag, ubah.toString("base64")].join("."))).toThrow();
  });
});
