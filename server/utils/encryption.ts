import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Convert callback-based functions to promise-based
const randomBytes = promisify(crypto.randomBytes);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// File storage directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ENCRYPTED_DIR = path.join(UPLOAD_DIR, 'encrypted');

// Ensure directories exist
async function ensureDirectoriesExist() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(ENCRYPTED_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

ensureDirectoriesExist();

// Encryption algorithms
const ALGORITHMS = {
  AES_256: 'aes-256-cbc',
  RSA_2048: 'rsa-2048'
};

// Generate a secure random initialization vector
async function generateIV() {
  return await randomBytes(16);
}

// Generate a secure encryption key
async function generateKey(algorithm = ALGORITHMS.AES_256) {
  if (algorithm === ALGORITHMS.AES_256) {
    // AES-256 requires a 32-byte key
    return await randomBytes(32);
  } else if (algorithm === ALGORITHMS.RSA_2048) {
    // For RSA, this would generate a key pair
    // Implementation simplified for this example
    return await randomBytes(32);
  }
  throw new Error(`Unsupported algorithm: ${algorithm}`);
}

// Encrypt a file
async function encryptFile(
  sourcePath: string,
  algorithm = ALGORITHMS.AES_256
): Promise<{ 
  filePath: string; 
  encryptedName: string; 
  key: string; 
  iv: string; 
}> {
  // Generate encryption key and IV
  const key = await generateKey(algorithm);
  const iv = await generateIV();
  
  // Create a unique encrypted filename
  const timestamp = Date.now();
  const randomId = (await randomBytes(8)).toString('hex');
  const encryptedName = `${timestamp}-${randomId}${path.extname(sourcePath)}`;
  const destinationPath = path.join(ENCRYPTED_DIR, encryptedName);
  
  // Read the input file
  const data = await readFile(sourcePath);
  
  // Encrypt the file
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encryptedData = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);
  
  // Write the encrypted file
  await writeFile(destinationPath, encryptedData);
  
  // Return encryption metadata
  return {
    filePath: destinationPath,
    encryptedName,
    key: key.toString('hex'),
    iv: iv.toString('hex')
  };
}

// Decrypt a file
async function decryptFile(
  filePath: string,
  key: string,
  iv: string,
  algorithm = ALGORITHMS.AES_256
): Promise<Buffer> {
  // Convert key and IV from hex to buffers
  const keyBuffer = Buffer.from(key, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  
  // Read the encrypted file
  const encryptedData = await readFile(filePath);
  
  // Decrypt the file
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
  const decryptedData = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);
  
  return decryptedData;
}

// Delete an encrypted file
async function deleteEncryptedFile(filePath: string): Promise<boolean> {
  try {
    await promisify(fs.unlink)(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// Get file size in bytes
function getFileSize(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) reject(err);
      else resolve(stats.size);
    });
  });
}

// Export the encryption utilities
export {
  ALGORITHMS,
  encryptFile,
  decryptFile,
  deleteEncryptedFile,
  getFileSize,
  UPLOAD_DIR,
  ENCRYPTED_DIR
};
