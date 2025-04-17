import CryptoJS from 'crypto-js';

/**
 * Encrypt a string using AES-256
 * @param text The text to encrypt
 * @param key The encryption key
 * @param iv Initialization vector (optional)
 * @returns Object containing the encrypted text and IV
 */
export function encrypt(text: string, key: string, iv?: string): { 
  encryptedText: string; 
  iv: string; 
} {
  // Generate a random IV if not provided
  const ivToUse = iv ? CryptoJS.enc.Hex.parse(iv) : CryptoJS.lib.WordArray.random(16);
  const ivHex = iv || CryptoJS.enc.Hex.stringify(ivToUse);
  
  // Encrypt the text
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: ivToUse,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });
  
  return {
    encryptedText: encrypted.toString(),
    iv: ivHex
  };
}

/**
 * Decrypt an encrypted string using AES-256
 * @param encryptedText The encrypted text
 * @param key The encryption key
 * @param iv Initialization vector
 * @returns The decrypted text
 */
export function decrypt(encryptedText: string, key: string, iv: string): string {
  const ivParsed = CryptoJS.enc.Hex.parse(iv);
  
  // Decrypt the text
  const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
    iv: ivParsed,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Generate a SHA-256 hash of a file
 * @param file The file to hash
 * @returns Promise resolving to the SHA-256 hash
 */
export function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const wordArray = CryptoJS.lib.WordArray.create(e.target?.result as ArrayBuffer);
        const hash = CryptoJS.SHA256(wordArray).toString();
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate a random AES key
 * @returns A random 256-bit key as hex string
 */
export function generateAESKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

/**
 * Encrypt a file with AES-256
 * @param file The file to encrypt
 * @param key The encryption key
 * @returns Promise resolving to the encrypted file data
 */
export function encryptFile(file: File, key: string): Promise<{ encryptedData: string; iv: string; hash: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const wordArray = CryptoJS.lib.WordArray.create(e.target?.result as ArrayBuffer);
        const iv = CryptoJS.lib.WordArray.random(16);
        const ivHex = CryptoJS.enc.Hex.stringify(iv);
        
        // Encrypt the file data
        const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
          iv: iv,
          padding: CryptoJS.pad.Pkcs7,
          mode: CryptoJS.mode.CBC
        });
        
        // Generate file hash
        const hash = CryptoJS.SHA256(wordArray).toString();
        
        resolve({
          encryptedData: encrypted.toString(),
          iv: ivHex,
          hash
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @param decimals Number of decimal places
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
