// Real encryption and decryption using Web Crypto API

// Constants for encryption
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derives an encryption key from a password
 * @param password The user's password
 * @param salt Salt for key derivation
 * @returns The derived key
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    // Convert password to key material
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Import password as key material
    const baseKey = await crypto.subtle.importKey(
        "raw",
        passwordData,
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    // Derive actual key using PBKDF2
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: ITERATIONS,
            hash: "SHA-256",
        },
        baseKey,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a message with a password
 * @param message The message to encrypt
 * @param password The password to encrypt with
 * @returns The encrypted message in the format [E2E:encrypted_data]
 */
export async function encrypt(message: string, password: string): Promise<string> {
    try {
        // Generate a random salt and IV
        const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        // Derive key from password
        const key = await deriveKey(password, salt);

        // Encrypt the message
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const encrypted = await crypto.subtle.encrypt(
            {
                name: ALGORITHM,
                iv: iv
            },
            key,
            data
        );

        // Combine the salt, IV, and encrypted data
        const encryptedArray = new Uint8Array(encrypted);
        const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(encryptedArray, salt.length + iv.length);

        // Convert to base64 and return formatted string
        const base64 = btoa(String.fromCharCode(...result));
        return `[E2E:${base64}]`;
    } catch (error) {
        console.error("Encryption failed:", error);
        return `[Failed to encrypt message]`;
    }
}

/**
 * Decrypts a message with a password
 * @param encrypted The encrypted message
 * @param password The password to decrypt with
 * @returns The decrypted message or null if decryption fails
 */
export async function decrypt(encrypted: string, password: string): Promise<string | null> {
    try {
        // Extract the encrypted part
        const match = encrypted.match(/\[E2E:([A-Za-z0-9+/=]+)\]/);
        if (!match) return null;

        // Decode from base64
        const encryptedData = Uint8Array.from(atob(match[1]), c => c.charCodeAt(0));

        // Extract salt, IV, and encrypted data
        const salt = encryptedData.slice(0, SALT_LENGTH);
        const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const data = encryptedData.slice(SALT_LENGTH + IV_LENGTH);

        // Derive key from password
        const key = await deriveKey(password, salt);

        // Decrypt the message
        const decrypted = await crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: iv
            },
            key,
            data
        );

        // Convert to string and return
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
} 