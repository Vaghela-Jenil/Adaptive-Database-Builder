import CryptoJS from 'crypto-js';

/**
 * Generate a shared encryption key from two user IDs
 * This ensures both users can encrypt/decrypt each other's messages
 */
export function generateSharedKey(userId1: string, userId2: string): string {
  // Sort IDs to ensure same key regardless of sender/receiver order
  const sortedIds = [userId1, userId2].sort().join('|');
  // Create a consistent key from both user IDs
  const key = CryptoJS.SHA256(sortedIds + process.env.ENCRYPTION_SALT || 'default_salt').toString();
  return key;
}

/**
 * Encrypt a message using AES encryption
 * @param message - The message to encrypt
 * @param encryptionKey - The shared encryption key
 * @returns Encrypted message
 */
export function encryptMessage(message: string, encryptionKey: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(message, encryptionKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message using AES decryption
 * @param encryptedMessage - The encrypted message
 * @param encryptionKey - The shared encryption key
 * @returns Decrypted message
 */
export function decryptMessage(encryptedMessage: string, encryptionKey: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, encryptionKey).toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Encrypt file metadata (name, size)
 * @param fileMetadata - Object with file metadata
 * @param encryptionKey - The shared encryption key
 * @returns Encrypted JSON string
 */
export function encryptFileMetadata(fileMetadata: any, encryptionKey: string): string {
  try {
    const jsonString = JSON.stringify(fileMetadata);
    return encryptMessage(jsonString, encryptionKey);
  } catch (error) {
    console.error('Error encrypting file metadata:', error);
    throw new Error('Failed to encrypt file metadata');
  }
}

/**
 * Decrypt file metadata
 * @param encryptedMetadata - Encrypted metadata
 * @param encryptionKey - The shared encryption key
 * @returns Parsed metadata object
 */
export function decryptFileMetadata(encryptedMetadata: string, encryptionKey: string): any {
  try {
    const decrypted = decryptMessage(encryptedMetadata, encryptionKey);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error decrypting file metadata:', error);
    throw new Error('Failed to decrypt file metadata');
  }
}

/**
 * Check if a message is encrypted (has encryption markers)
 * @param message - Message to check
 * @returns true if encrypted
 */
export function isEncrypted(message: string): boolean {
  return message.startsWith('U2FsdGVkX1'); // CryptoJS AES encrypted messages start with this
}
