import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Enkripsi kolom sensitif (NIK) dengan AES-256-GCM. Hasil: "iv.tag.ciphertext" (base64).
 * Kunci 32 byte dari env NIK_ENCRYPTION_KEY; tidak pernah dikirim ke browser.
 */
function kunci(): Buffer {
  const k = Buffer.from(process.env.NIK_ENCRYPTION_KEY ?? "", "base64");
  if (k.length !== 32) throw new Error("NIK_ENCRYPTION_KEY harus 32 byte (base64).");
  return k;
}

export function enkripsi(teks: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", kunci(), iv);
  const isi = Buffer.concat([cipher.update(teks, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), isi].map((b) => b.toString("base64")).join(".");
}

export function dekripsi(sandi: string): string {
  const [iv, tag, isi] = sandi.split(".").map((s) => Buffer.from(s, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", kunci(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(isi), decipher.final()]).toString("utf8");
}
