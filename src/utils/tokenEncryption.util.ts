import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const TAG_POSITION = IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

const getEncryptionKey = (): Buffer => {
    const key = process.env.APPOINTMENT_LINK_ENCRYPTION_KEY;
    if (!key) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("APPOINTMENT_LINK_ENCRYPTION_KEY environment variable is required in production");
        }
        return crypto.scryptSync("default-dev-key-change-in-production", "salt", 32);
    }
    return Buffer.from(key, "hex");
};

export const encryptToken = (token: string): string => {
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, encrypted]).toString("base64url");
    } catch (error) {
        throw new Error(`Token encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};

export const decryptToken = (encryptedToken: string): string => {
    try {
        const key = getEncryptionKey();
        const decodedToken = (() => {
            try {
                return decodeURIComponent(encryptedToken);
            } catch {
                return encryptedToken;
            }
        })();

        const data = (() => {
            try {
                return Buffer.from(decodedToken, "base64url");
            } catch {
                try {
                    return Buffer.from(decodedToken, "base64");
                } catch {
                    throw new Error("Invalid token encoding format");
                }
            }
        })();

        if (data.length < ENCRYPTED_POSITION) {
            throw new Error("Invalid encrypted token format - token too short");
        }

        const iv = data.subarray(0, TAG_POSITION);
        const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION);
        const encrypted = data.subarray(ENCRYPTED_POSITION);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    } catch (error) {
        throw new Error(`Token decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};
