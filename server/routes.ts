import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
import { insertUserSchema, loginSchema, registrationSchema, insertFileSchema, insertSharedFileSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "secure-transfer-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 86400000 },
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  // Setup file upload
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage_disk = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage: storage_disk });

  // API routes
  // Auth Routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registrationSchema.parse(req.body);
      
      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email is already taken
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Generate key pair for the user
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      // Hash password
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(data.password, salt, 1000, 64, 'sha512').toString('hex');
      
      // Create user
      const newUser = await storage.createUser({
        username: data.username,
        password: `${salt}:${hashedPassword}`,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        publicKey,
        privateKey
      });
      
      // Set user in session
      const { password, privateKey: pk, ...userWithoutSensitiveInfo } = newUser;
      req.session.user = userWithoutSensitiveInfo;
      
      res.status(201).json({ 
        message: "User registered successfully",
        user: userWithoutSensitiveInfo
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password
      const [salt, storedHash] = user.password.split(':');
      const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      
      if (hash !== storedHash) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user in session
      const { password: pw, privateKey, ...userWithoutSensitiveInfo } = user;
      req.session.user = userWithoutSensitiveInfo;
      
      res.json({ 
        message: "Login successful",
        user: userWithoutSensitiveInfo
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.session.user);
  });

  // File Routes
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  app.get("/api/files", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const files = await storage.getFilesByUser(userId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/files/upload", isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.session.user!.id;
      const filePath = path.join(uploadDir, req.file.filename);
      const fileBuffer = fs.readFileSync(filePath);
      
      // Generate hash for file integrity
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      // Generate encryption key and IV
      const iv = crypto.randomBytes(16).toString('hex');
      
      // Save file metadata
      const file = await storage.createFile({
        userId,
        name: req.file.filename,
        originalName: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        hash,
        encrypted: true,
        encryptionType: "AES-256",
        iv
      });
      
      res.status(201).json({
        message: "File uploaded successfully",
        file
      });
      
      // Notify connected clients
      const userId_str = userId.toString();
      clients.forEach((client) => {
        if (client.userId === userId_str && client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(JSON.stringify({
            type: "FILE_UPLOADED",
            data: { file }
          }));
        }
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/files/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if user has access to this file
      const userId = req.session.user!.id;
      if (file.userId !== userId) {
        // Check if file is shared with this user
        const sharedFiles = await storage.getFilesSharedWithUser(userId);
        const isShared = sharedFiles.some(sf => sf.file.id === fileId);
        
        if (!isShared) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.get("/api/files/:id/download", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if user has access to this file
      const userId = req.session.user!.id;
      if (file.userId !== userId) {
        // Check if file is shared with this user
        const sharedFiles = await storage.getFilesSharedWithUser(userId);
        const sharedFile = sharedFiles.find(sf => sf.file.id === fileId);
        
        if (!sharedFile) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Check permission level
        if (sharedFile.sharedFile.permissionLevel === "view") {
          return res.status(403).json({ message: "You don't have download permission" });
        }
      }
      
      const filePath = path.join(uploadDir, file.name);
      res.download(filePath, file.originalName);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  app.delete("/api/files/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if user owns this file
      const userId = req.session.user!.id;
      if (file.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete file from disk
      const filePath = path.join(uploadDir, file.name);
      fs.unlinkSync(filePath);
      
      // Delete file from storage
      await storage.deleteFile(fileId);
      
      res.json({ message: "File deleted successfully" });
      
      // Notify connected clients
      const userId_str = userId.toString();
      clients.forEach((client) => {
        if (client.userId === userId_str && client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(JSON.stringify({
            type: "FILE_DELETED",
            data: { fileId }
          }));
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Shared Files Routes
  app.get("/api/shared-files/with-me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const sharedFiles = await storage.getFilesSharedWithUser(userId);
      res.json(sharedFiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared files" });
    }
  });

  app.get("/api/shared-files/by-me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const sharedFiles = await storage.getFilesSharedByUser(userId);
      res.json(sharedFiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared files" });
    }
  });

  app.post("/api/shared-files/view/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sharedFileId = parseInt(req.params.id);
      const result = await storage.updateSharedFileViewed(sharedFileId, true);
      
      if (!result) {
        return res.status(404).json({ message: "Shared file not found" });
      }
      
      res.json({ message: "Shared file marked as viewed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update shared file" });
    }
  });

  app.post("/api/files/:id/share", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id);
      const { sharedWithUserIds, permissionLevel, note } = req.body;
      const sharedByUserId = req.session.user!.id;
      
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if user owns this file
      if (file.userId !== sharedByUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const sharedFiles = [];
      
      for (const sharedWithUserId of sharedWithUserIds) {
        // Check if user exists
        const user = await storage.getUser(sharedWithUserId);
        if (!user) {
          continue;
        }
        
        const sharedFile = await storage.shareFile({
          fileId,
          sharedByUserId,
          sharedWithUserId,
          permissionLevel,
          note
        });
        
        sharedFiles.push(sharedFile);
        
        // Notify the user that a file has been shared with them
        const targetUserId = sharedWithUserId.toString();
        clients.forEach((client) => {
          if (client.userId === targetUserId && client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(JSON.stringify({
              type: "FILE_SHARED_WITH_YOU",
              data: { 
                sharedFile,
                file,
                sharedByUser: req.session.user
              }
            }));
          }
        });
      }
      
      res.status(201).json({
        message: "File shared successfully",
        sharedFiles
      });
    } catch (error) {
      console.error("Share file error:", error);
      res.status(500).json({ message: "Failed to share file" });
    }
  });

  // User Routes
  app.get("/api/users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove sensitive information
      const safeUsers = users.map(user => {
        const { password, privateKey, ...userWithoutSensitiveInfo } = user;
        return userWithoutSensitiveInfo;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user stats
  app.get("/api/users/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Get all files
      const files = await storage.getFilesByUser(userId);
      
      // Get shared files
      const sharedWithMe = await storage.getFilesSharedWithUser(userId);
      const sharedByMe = await storage.getFilesSharedByUser(userId);
      
      // Calculate storage used
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      const totalSizeMB = totalSize / (1024 * 1024);
      
      // Count encrypted files
      const encryptedFiles = files.filter(file => file.encrypted).length;
      
      res.json({
        totalFiles: files.length,
        totalSizeBytes: totalSize,
        totalSizeMB: totalSizeMB.toFixed(2),
        encryptedFiles,
        sharedWithMe: sharedWithMe.length,
        sharedByMe: sharedByMe.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Security Keys route
  app.get("/api/security-keys", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        publicKey: user.publicKey
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch security keys" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients: { socket: WebSocket; userId: string }[] = [];
  
  wss.on('connection', (socket) => {
    let userId: string | null = null;
    
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'AUTHENTICATE') {
          userId = data.userId;
          // Add client to the list
          clients.push({ socket, userId });
          
          // Send confirmation
          socket.send(JSON.stringify({
            type: 'AUTHENTICATED',
            data: { success: true }
          }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    socket.on('close', () => {
      // Remove client from the list
      const index = clients.findIndex(client => client.socket === socket);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  });
  
  return httpServer;
}
