import { files, type File, type InsertFile, users, type User, type InsertUser, sharedFiles, type SharedFile, type InsertSharedFile } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByUser(userId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  
  // Shared file operations
  shareFile(sharedFile: InsertSharedFile): Promise<SharedFile>;
  getSharedFilesByUser(userId: number): Promise<SharedFile[]>;
  getFilesSharedWithUser(userId: number): Promise<{ sharedFile: SharedFile; file: File; sharedByUser: User }[]>;
  getFilesSharedByUser(userId: number): Promise<{ sharedFile: SharedFile; file: File; sharedWithUser: User }[]>;
  updateSharedFileViewed(id: number, viewed: boolean): Promise<boolean>;
  deleteSharedFile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private sharedFiles: Map<number, SharedFile>;
  private userIdCounter: number;
  private fileIdCounter: number;
  private sharedFileIdCounter: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.sharedFiles = new Map();
    this.userIdCounter = 1;
    this.fileIdCounter = 1;
    this.sharedFileIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByUser(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const file: File = {
      ...insertFile,
      id,
      uploadedAt: now
    };
    this.files.set(id, file);
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    // First delete all shared file entries
    const relatedSharedFiles = Array.from(this.sharedFiles.values()).filter(sf => sf.fileId === id);
    for (const sf of relatedSharedFiles) {
      this.sharedFiles.delete(sf.id);
    }
    
    // Then delete the file
    return this.files.delete(id);
  }

  // Shared file methods
  async shareFile(insertSharedFile: InsertSharedFile): Promise<SharedFile> {
    const id = this.sharedFileIdCounter++;
    const now = new Date();
    const sharedFile: SharedFile = {
      ...insertSharedFile,
      id,
      sharedAt: now,
      viewed: false
    };
    this.sharedFiles.set(id, sharedFile);
    return sharedFile;
  }

  async getSharedFilesByUser(userId: number): Promise<SharedFile[]> {
    return Array.from(this.sharedFiles.values()).filter(
      (sf) => sf.sharedByUserId === userId || sf.sharedWithUserId === userId
    );
  }

  async getFilesSharedWithUser(userId: number): Promise<{ sharedFile: SharedFile; file: File; sharedByUser: User }[]> {
    const results: { sharedFile: SharedFile; file: File; sharedByUser: User }[] = [];
    
    for (const sf of Array.from(this.sharedFiles.values()).filter(sf => sf.sharedWithUserId === userId)) {
      const file = this.files.get(sf.fileId);
      const sharedByUser = this.users.get(sf.sharedByUserId);
      
      if (file && sharedByUser) {
        results.push({ sharedFile: sf, file, sharedByUser });
      }
    }
    
    return results;
  }

  async getFilesSharedByUser(userId: number): Promise<{ sharedFile: SharedFile; file: File; sharedWithUser: User }[]> {
    const results: { sharedFile: SharedFile; file: File; sharedWithUser: User }[] = [];
    
    for (const sf of Array.from(this.sharedFiles.values()).filter(sf => sf.sharedByUserId === userId)) {
      const file = this.files.get(sf.fileId);
      const sharedWithUser = this.users.get(sf.sharedWithUserId);
      
      if (file && sharedWithUser) {
        results.push({ sharedFile: sf, file, sharedWithUser });
      }
    }
    
    return results;
  }

  async updateSharedFileViewed(id: number, viewed: boolean): Promise<boolean> {
    const sharedFile = this.sharedFiles.get(id);
    if (!sharedFile) return false;
    
    sharedFile.viewed = viewed;
    this.sharedFiles.set(id, sharedFile);
    return true;
  }

  async deleteSharedFile(id: number): Promise<boolean> {
    return this.sharedFiles.delete(id);
  }
}

export const storage = new MemStorage();
