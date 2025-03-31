import express from 'express';
import crypto from 'crypto';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { promisify } from 'util';
import { storage } from './storage.js';
import { 
  encryptFile, 
  decryptFile, 
  deleteEncryptedFile, 
  ensureDirectoriesExist,
  getFileSize
} from './utils/encryption.js';
import { log } from './vite.js';

// Promisify file system operations
const unlink = promisify(fs.unlink);

// Configure multer storage for file uploads
const multerStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await ensureDirectoriesExist();
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: multerStorage });

// Get client IP address
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         'unknown';
};

// Register all API routes
async function registerRoutes(app) {
  // Ensure uploads directory exists
  await ensureDirectoriesExist();
  
  // Authentication middleware
  const authenticate = (req, res, next) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  };
  
  // User registration
  app.post('/api/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      // Generate salt and hash password
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
        .toString('hex');
      
      // Create user
      const user = await storage.createUser({ 
        username, 
        passwordHash, 
        salt 
      });
      
      // Save user ID in session (auto login after register)
      req.session.user = {
        id: user.id,
        username: user.username
      };
      
      return res.status(201).json({ 
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      log(`Registration error: ${error.message}`, 'routes');
      return res.status(500).json({ message: 'Error registering user' });
    }
  });
  
  // User login
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Verify password
      const hash = crypto
        .pbkdf2Sync(password, user.salt, 1000, 64, 'sha512')
        .toString('hex');
      
      if (hash !== user.passwordHash) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Save user ID in session
      req.session.user = {
        id: user.id,
        username: user.username
      };
      
      return res.json({ 
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      log(`Login error: ${error.message}`, 'routes');
      return res.status(500).json({ message: 'Error logging in' });
    }
  });
  
  // Get current user
  app.get('/api/me', authenticate, (req, res) => {
    return res.json(req.user);
  });
  
  // Upload file
  app.post('/api/files/upload', authenticate, upload.single('file'), 
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const { isEncrypted = 'true' } = req.body;
        const shouldEncrypt = isEncrypted === 'true';
        
        const file = req.file;
        const originalFilename = file.originalname;
        const tempFilePath = file.path;
        const userId = req.user.id;
        
        // Generate unique filename for encrypted file
        const filename = path.basename(tempFilePath);
        const encryptedFilePath = path.join('./uploads/encrypted', filename);
        
        let fileData = {
          userId,
          filename,
          originalFilename,
          size: file.size,
          type: file.mimetype,
          isEncrypted: shouldEncrypt,
          path: shouldEncrypt ? encryptedFilePath : tempFilePath,
        };
        
        // Encrypt file if needed
        if (shouldEncrypt) {
          try {
            const encryptionResult = await encryptFile(tempFilePath, encryptedFilePath);
            
            // Add encryption details to file data
            fileData.encryptionKey = encryptionResult.key;
            fileData.encryptionIV = encryptionResult.iv;
            
            // Delete temporary file
            await unlink(tempFilePath);
            
            // Update file size to the encrypted size
            fileData.size = await getFileSize(encryptedFilePath);
          } catch (encryptError) {
            log(`Encryption error: ${encryptError.message}`, 'routes');
            return res.status(500).json({ message: 'Error encrypting file' });
          }
        }
        
        // Save file data to storage
        const savedFile = await storage.createFile(fileData);
        
        // Create access log
        await storage.createAccessLog({
          fileId: savedFile.id,
          userId,
          ipAddress: getIpAddress(req),
          action: 'upload'
        });
        
        return res.status(201).json({
          message: 'File uploaded successfully',
          file: savedFile
        });
      } catch (error) {
        log(`File upload error: ${error.message}`, 'routes');
        return res.status(500).json({ message: 'Error uploading file' });
      }
    });
  
  // Get user files
  app.get('/api/files', authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const files = await storage.getFiles(userId);
      
      return res.json(files);
    } catch (error) {
      log(`Get files error: ${error.message}`, 'routes');
      return res.status(500).json({ message: 'Error retrieving files' });
    }
  });
  
  // Get file details
  app.get('/api/files/:id', authenticate, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Check ownership
      if (file.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to access this file' });
      }
      
      // Create access log
      await storage.createAccessLog({
        fileId,
        userId,
        ipAddress: getIpAddress(req),
        action: 'view'
      });
      
      // Update last accessed timestamp
      await storage.updateFile(fileId, { lastAccessed: new Date() });
      
      // Get access logs for the file
      const accessLogs = await storage.getFileAccessLogs(fileId);
      
      return res.json({
        file,
        accessLogs
      });
    } catch (error) {
      log(`Get file details error: ${error.message}`, 'routes');
      return res.status(500).json({ message: 'Error retrieving file details' });
    }
  });
  
  // Download file
  app.get('/api/files/:id/download', authenticate, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Check ownership
      if (file.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to access this file' });
      }
      
      // Create access log
      await storage.createAccessLog({
        fileId,
        userId,
        ipAddress: getIpAddress(req),
        action: 'download'
      });
      
      // Update last accessed timestamp
      await storage.updateFile(fileId, { lastAccessed: new Date() });
      
      // If file is encrypted, decrypt it first
      if (file.isEncrypted) {
        const decryptedFilePath = path.join('./uploads/decrypted', file.filename);
        
        try {
          await decryptFile(
            file.path,
            decryptedFilePath,
            file.encryptionKey,
            file.encryptionIV
          );
          
          // Set download headers
          res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
          res.setHeader('Content-Type', file.type || 'application/octet-stream');
          
          // Stream the decrypted file
          const fileStream = fs.createReadStream(decryptedFilePath);
          fileStream.pipe(res);
          
          // Clean up decrypted file after download
          fileStream.on('end', async () => {
            try {
              await unlink(decryptedFilePath);
            } catch (cleanupError) {
              log(`Error cleaning up decrypted file: ${cleanupError.message}`, 'routes');
            }
          });
        } catch (decryptError) {
          log(`Decryption error: ${decryptError.message}`, 'routes');
          return res.status(500).json({ message: 'Error decrypting file' });
        }
      } else {
        // Set download headers for non-encrypted file
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
        res.setHeader('Content-Type', file.type || 'application/octet-stream');
        
        // Stream the file directly
        fs.createReadStream(file.path).pipe(res);
      }
    } catch (error) {
      log(`File download error: ${error.message}`, 'routes');
      return res.status(500).json({ message: 'Error downloading file' });
    }
  });
  
  // Delete file
  app.delete('/api/files/:id', authenticate, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Check ownership
      if (file.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to delete this file' });
      }
      
      // Delete physical file
      const filePath = file.path;
      let fileDeleted = false;
      
      if (fs.existsSync(filePath)) {
        fileDeleted = file.isEncrypted 
          ? await deleteEncryptedFile(filePath)
          : await unlink(filePath).then(() => true).catch(() => false);
      }
      
      // Delete file record
      const deleted = await storage.deleteFile(fileId);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Error deleting file record' });
      }
      
      // Create access log
      await storage.createAccessLog({
        fileId,
        userId,
        ipAddress: getIpAddress(req),
        action: 'delete'
      });
      
      return res.json({ 
        message: 'File deleted successfully',
        fileDeleted
      });
    } catch (error) {
      log(`File deletion error: ${error.message}`, 'routes');
      return res.status(500).json({ message: 'Error deleting file' });
    }
  });
  
  // Logout
  app.post('/api/logout', authenticate, (req, res) => {
    req.session.destroy();
    return res.json({ message: 'Logged out successfully' });
  });
  
  return null; // No specific server to return
}

export { registerRoutes };