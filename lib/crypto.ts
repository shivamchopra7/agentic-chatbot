import crypto from "node:crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const _AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM
 * Returns base64 encoded string: iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // Derive a 32-byte key from the environment variable
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Combine iv, authTag, and encrypted data
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  const [ivBase64, authTagBase64, encryptedData] = encryptedText.split(":");

  if (!ivBase64 || !authTagBase64 || !encryptedData) {
    throw new Error("Invalid encrypted text format");
  }

  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Creates a SHA-256 hash of the API key for verification purposes
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Validates that a given API key matches its stored hash
 */
export function verifyApiKeyHash(apiKey: string, storedHash: string): boolean {
  const computedBuf = Buffer.from(hashApiKey(apiKey));
  const storedBuf = Buffer.from(storedHash);
  if (computedBuf.length !== storedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(computedBuf, storedBuf);
}
