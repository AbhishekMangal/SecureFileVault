import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { 
  encryptFile, 
  decryptFile, 
  deleteEncryptedFile,
  getFileSize,
  ALGORITHMS,
  UPLOAD_DIR
} from "./utils/encryption";
import { 
  insertUserSchema, 
  insertFileSchema, 
  loginSchema, 
  registerSchema,
  insertAccessLogSchema
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Helper to extract user IP
const getIpAddress = (req: Request): string => {
  return req.ip || 
         req.socket.remoteAddress || 
         req.headers['x-forwarded-for'] as string || 
         'unknown';
};

// Simple in-memory session storage (in a real app, use express-session)
const sessions: Record<string, { userId: number; username: string }> = {};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.headers.authorization?.split(' ')[1];
    if (!sessionId || !sessions[sessionId]) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    (req as any).user = sessions[sessionId];
    next();
  };

  // User registration
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create user (in a real app, hash the password)
      const { confirmPassword, ...userToInsert } = userData;
      const user = await storage.createUser(userToInsert);
      
      // Create session
      const sessionId = Math.random().toString(36).substring(2);
      sessions[sessionId] = { userId: user.id, username: user.username };
      
      res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        token: sessionId 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // User login
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByUsername(loginData.username);
      if (!user || user.password !== loginData.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Create session
      const sessionId = Math.random().toString(36).substring(2);
      sessions[sessionId] = { userId: user.id, username: user.username };
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        token: sessionId 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user info
  app.get('/api/me', authenticate, (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({ id: user.userId, username: user.username });
  });

  // File upload with encryption
  app.post(
    '/api/files/upload', 
    authenticate, 
    upload.single('file'), 
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        const user = (req as any).user;
        const algorithm = req.body.algorithm || ALGORITHMS.AES_256;
        
        // Get uploaded file details
        const uploadedFilePath = req.file.path;
        const fileSize = await getFileSize(uploadedFilePath);
        
        // Encrypt the file
        const { 
          filePath, 
          encryptedName, 
          key, 
          iv 
        } = await encryptFile(uploadedFilePath, algorithm);
        
        // Create file record
        const fileData = {
          userId: user.userId,
          originalName: req.file.originalname,
          encryptedName,
          fileType: path.extname(req.file.originalname).substring(1),
          filePath,
          fileSize,
          encryptionAlgorithm: algorithm,
          isEncrypted: true,
          fileKey: key,
          fileIV: iv
        };
        
        // Validate and save file data
        const validatedFileData = insertFileSchema.parse(fileData);
        const savedFile = await storage.createFile(validatedFileData);
        
        // Create access log
        await storage.createAccessLog({
          fileId: savedFile.id,
          userId: user.userId,
          action: 'upload',
          ipAddress: getIpAddress(req)
        });
        
        // Delete the original uploaded file
        await promisify(fs.unlink)(uploadedFilePath);
        
        res.status(201).json({
          id: savedFile.id,
          originalName: savedFile.originalName,
          fileType: savedFile.fileType,
          fileSize: savedFile.fileSize,
          encryptionAlgorithm: savedFile.encryptionAlgorithm,
          isEncrypted: savedFile.isEncrypted,
          createdAt: savedFile.createdAt
        });
      } catch (error) {
        console.error('Upload error:', error);
        if (req.file) {
          // Clean up uploaded file on error
          await promisify(fs.unlink)(req.file.path).catch(() => {});
        }
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors 
          });
        }
        res.status(500).json({ message: "Server error during file upload" });
      }
    }
  );

  // List user's files
  app.get('/api/files', authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const files = await storage.getFiles(user.userId);
      
      // Return only non-sensitive data
      const filesList = files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        encryptionAlgorithm: file.encryptionAlgorithm,
        isEncrypted: file.isEncrypted,
        createdAt: file.createdAt,
        lastAccessed: file.lastAccessed
      }));
      
      res.json(filesList);
    } catch (error) {
      console.error('List files error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get file details
  app.get('/api/files/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const fileId = parseInt(req.params.id);
      
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Create access log
      await storage.createAccessLog({
        fileId: file.id,
        userId: user.userId,
        action: 'view',
        ipAddress: getIpAddress(req)
      });
      
      // Update last accessed time
      await storage.updateFile(fileId, { lastAccessed: new Date() });
      
      // Get access logs for this file
      const accessLogs = await storage.getFileAccessLogs(fileId, 5);
      
      // Return file details without sensitive data
      res.json({
        id: file.id,
        originalName: file.originalName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        encryptionAlgorithm: file.encryptionAlgorithm,
        isEncrypted: file.isEncrypted,
        createdAt: file.createdAt,
        lastAccessed: file.lastAccessed,
        accessLogs: accessLogs.map(log => ({
          action: log.action,
          ipAddress: log.ipAddress,
          timestamp: log.timestamp
        }))
      });
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Download file
  app.get('/api/files/:id/download', authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const fileId = parseInt(req.params.id);
      
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Create access log
      await storage.createAccessLog({
        fileId: file.id,
        userId: user.userId,
        action: 'download',
        ipAddress: getIpAddress(req)
      });
      
      // Update last accessed time
      await storage.updateFile(fileId, { lastAccessed: new Date() });
      
      // Decrypt the file
      const decryptedData = await decryptFile(
        file.filePath,
        file.fileKey,
        file.fileIV,
        file.encryptionAlgorithm
      );
      
      // Set download headers
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', decryptedData.length);
      
      // Send the decrypted file
      res.send(decryptedData);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: "Server error during file download" });
    }
  });

  // Delete file
  app.delete('/api/files/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const fileId = parseInt(req.params.id);
      
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Create access log before deletion
      await storage.createAccessLog({
        fileId: file.id,
        userId: user.userId,
        action: 'delete',
        ipAddress: getIpAddress(req)
      });
      
      // Delete the encrypted file
      await deleteEncryptedFile(file.filePath);
      
      // Delete the file record
      await storage.deleteFile(fileId);
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ message: "Server error during file deletion" });
    }
  });

  // Logout
  app.post('/api/logout', authenticate, (req: Request, res: Response) => {
    const sessionId = req.headers.authorization?.split(' ')[1] || '';
    if (sessions[sessionId]) {
      delete sessions[sessionId];
    }
    res.json({ message: "Logged out successfully" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
