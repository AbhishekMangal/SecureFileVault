import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { log } from '../vite.js';

// Promisify file system operations
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

// Encryption constants
export const ALGORITHMS = {
  AES_256: 'aes-256-cbc',
  RSA_2048: 'rsa-2048'
};

// Ensure upload directories exist
export async function ensureDirectoriesExist() {
  const dirs = [
    './uploads',
    './uploads/encrypted',
    './uploads/decrypted'
  ];
  
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        await mkdir(dir, { recursive: true });
        log(`Created directory: ${dir}`, 'encryption');
      }
    } catch (error) {
      log(`Error creating directory ${dir}: ${error.message}`, 'encryption');
      throw error;
    }
  }
}

// Generate initialization vector for AES encryption
export async function generateIV() {
  return crypto.randomBytes(16);
}

// Generate encryption key
export async function generateKey(algorithm = ALGORITHMS.AES_256) {
  switch (algorithm) {
    case ALGORITHMS.AES_256:
      return crypto.randomBytes(32); // 256 bits
    case ALGORITHMS.RSA_2048:
      return crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

// Encrypt file
export async function encryptFile(
  sourceFilePath,
  destinationFilePath,
  algorithm = ALGORITHMS.AES_256
) {
  await ensureDirectoriesExist();
  
  try {
    const iv = await generateIV();
    const key = await generateKey(algorithm);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(sourceFilePath);
    const output = fs.createWriteStream(destinationFilePath);
    
    return new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output);
      
      output.on('finish', () => {
        resolve({
          key: key.toString('hex'),
          iv: iv.toString('hex'),
          algorithm
        });
      });
      
      input.on('error', reject);
      output.on('error', reject);
      cipher.on('error', reject);
    });
  } catch (error) {
    log(`Encryption error: ${error.message}`, 'encryption');
    throw error;
  }
}

// Decrypt file
export async function decryptFile(
  sourceFilePath,
  destinationFilePath,
  key,
  iv,
  algorithm = ALGORITHMS.AES_256
) {
  await ensureDirectoriesExist();
  
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
    const input = fs.createReadStream(sourceFilePath);
    const output = fs.createWriteStream(destinationFilePath);
    
    return new Promise((resolve, reject) => {
      input.pipe(decipher).pipe(output);
      
      output.on('finish', resolve);
      input.on('error', reject);
      output.on('error', reject);
      decipher.on('error', reject);
    });
  } catch (error) {
    log(`Decryption error: ${error.message}`, 'encryption');
    throw error;
  }
}

// Delete encrypted file
export async function deleteEncryptedFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    log(`Error deleting encrypted file: ${error.message}`, 'encryption');
    return false;
  }
}

// Get file size
export function getFileSize(filePath) {
  return stat(filePath).then(stats => stats.size);
}