import { 
  users, type User, type InsertUser, 
  files, type File, type InsertFile,
  accessLogs, type AccessLog, type InsertAccessLog
} from "@shared/schema";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // File operations
  getFiles(userId: number): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<File>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;

  // Access logs
  createAccessLog(log: InsertAccessLog): Promise<AccessLog>;
  getFileAccessLogs(fileId: number, limit?: number): Promise<AccessLog[]>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private accessLogs: Map<number, AccessLog>;
  private userIdCounter: number;
  private fileIdCounter: number;
  private accessLogIdCounter: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.accessLogs = new Map();
    this.userIdCounter = 1;
    this.fileIdCounter = 1;
    this.accessLogIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // File operations
  async getFiles(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId
    );
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const file: File = { ...insertFile, id, createdAt: now, lastAccessed: now };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: number, updates: Partial<File>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...updates };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }

  // Access logs
  async createAccessLog(insertLog: InsertAccessLog): Promise<AccessLog> {
    const id = this.accessLogIdCounter++;
    const now = new Date();
    const log: AccessLog = { ...insertLog, id, timestamp: now };
    this.accessLogs.set(id, log);
    return log;
  }

  async getFileAccessLogs(fileId: number, limit = 5): Promise<AccessLog[]> {
    const logs = Array.from(this.accessLogs.values())
      .filter((log) => log.fileId === fileId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return logs.slice(0, limit);
  }
}

// Create and export a singleton instance
export const storage = new MemStorage();
