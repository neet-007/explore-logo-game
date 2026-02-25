import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const salt = parts[1];
  const hashHex = parts[2];

  const inputHash = scryptSync(password, salt, SCRYPT_KEYLEN);
  const stored = Buffer.from(hashHex, "hex");

  if (stored.length !== inputHash.length) {
    return false;
  }

  return timingSafeEqual(stored, inputHash);
}
