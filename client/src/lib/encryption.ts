// Client-side encryption utilities using CryptoJS

import CryptoJS from 'crypto-js';

// Supported encryption algorithms
export const ALGORITHMS = {
  AES_256: 'aes-256-cbc',
  RSA_2048: 'rsa-2048'
};

// Encrypt small text data (for client-side encryption)
export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

// Decrypt small text data (for client-side encryption)
export function decryptData(encrypted: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Calculate file hash (for integrity verification)
export async function calculateFileHash(file: File): Promise<string> {
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

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file type icon based on extension
export function getFileTypeIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'pdf':
      return 'picture_as_pdf';
    case 'doc':
    case 'docx':
      return 'description';
    case 'xls':
    case 'xlsx':
      return 'format_sheet';
    case 'ppt':
    case 'pptx':
      return 'slideshow';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return 'image';
    case 'zip':
    case 'rar':
    case '7z':
      return 'folder_zip';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audio_file';
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'video_file';
    case 'txt':
      return 'article';
    default:
      return 'insert_drive_file';
  }
}

// Get color for file type icon
export function getFileTypeColor(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'pdf':
      return 'text-red-500';
    case 'doc':
    case 'docx':
      return 'text-blue-500';
    case 'xls':
    case 'xlsx':
      return 'text-green-500';
    case 'ppt':
    case 'pptx':
      return 'text-amber-500';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return 'text-purple-500';
    case 'zip':
    case 'rar':
    case '7z':
      return 'text-amber-500';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'text-indigo-500';
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'text-pink-500';
    default:
      return 'text-slate-500';
  }
}
