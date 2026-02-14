import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.CRYPTO_SECRET;

if (!SECRET_KEY) {
  throw new Error("CRYPTO_SECRET is not defined");
}

export const decryptData = (encryptedValue: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error("Decryption failed: result is empty");
    }

    // Remove extra quotes if present
    if ((decrypted.startsWith('"') && decrypted.endsWith('"')) ||
        (decrypted.startsWith("'") && decrypted.endsWith("'"))) {
      return decrypted.slice(1, -1);
    }

    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt value:", err, encryptedValue);
    throw new Error("Failed to decrypt payload");
  }
};
