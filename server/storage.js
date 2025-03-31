import { connectToDatabase } from './db/mongodb.js';
import { log } from './vite.js';

// MongoDB Storage Implementation
class MongoDBStorage {
  constructor(models) {
    this.User = models.User;
    this.File = models.File;
    this.AccessLog = models.AccessLog;
  }

  // User Operations
  async getUser(id) {
    return await this.User.findOne({ id }).lean();
  }

  async getUserByUsername(username) {
    return await this.User.findOne({ username }).lean();
  }

  async createUser(user) {
    const newUser = new this.User(user);
    await newUser.save();
    return newUser.toObject();
  }

  // File Operations
  async getFiles(userId) {
    return await this.File.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async getFile(id) {
    return await this.File.findOne({ id }).lean();
  }

  async createFile(file) {
    const newFile = new this.File(file);
    await newFile.save();
    return newFile.toObject();
  }

  async updateFile(id, updates) {
    const updatedFile = await this.File.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();
    
    return updatedFile;
  }

  async deleteFile(id) {
    const result = await this.File.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Access Logs
  async createAccessLog(log) {
    const newLog = new this.AccessLog(log);
    await newLog.save();
    return newLog.toObject();
  }

  async getFileAccessLogs(fileId, limit = 5) {
    return await this.AccessLog.find({ fileId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }
}

// In-Memory Storage Implementation (Fallback)
class MemStorage {
  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.accessLogs = new Map();
    this.userIdCounter = 1;
    this.fileIdCounter = 1;
    this.accessLogIdCounter = 1;
  }

  // User Operations
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser) {
    const id = this.userIdCounter++;
    const now = new Date();
    const user = { ...insertUser, id, createdAt: now };
    
    this.users.set(id, user);
    return user;
  }

  // File Operations
  async getFiles(userId) {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId
    ).sort((a, b) => b.createdAt - a.createdAt);
  }

  async getFile(id) {
    return this.files.get(id);
  }

  async createFile(insertFile) {
    const id = this.fileIdCounter++;
    const now = new Date();
    const file = { ...insertFile, id, createdAt: now, lastAccessed: now };
    
    this.files.set(id, file);
    return file;
  }

  async updateFile(id, updates) {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...updates };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id) {
    return this.files.delete(id);
  }

  // Access Logs
  async createAccessLog(insertLog) {
    const id = this.accessLogIdCounter++;
    const now = new Date();
    const log = { ...insertLog, id, timestamp: now };
    
    this.accessLogs.set(id, log);
    return log;
  }

  async getFileAccessLogs(fileId, limit = 5) {
    return Array.from(this.accessLogs.values())
      .filter((log) => log.fileId === fileId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

// Initialize storage with MongoDB, fallback to memory if MongoDB is unavailable
async function initializeStorage() {
  // Try to connect to MongoDB
  const models = await connectToDatabase();
  
  if (models) {
    log('Using MongoDB storage', 'storage');
    return new MongoDBStorage(models);
  } else {
    log('Falling back to in-memory storage', 'storage');
    return new MemStorage();
  }
}

// Export a promise that resolves to the storage instance
const storagePromise = initializeStorage();

// Singleton accessor for storage
export const storage = {
  // Proxy all methods through the promise
  getUser: async (id) => (await storagePromise).getUser(id),
  getUserByUsername: async (username) => (await storagePromise).getUserByUsername(username),
  createUser: async (user) => (await storagePromise).createUser(user),
  getFiles: async (userId) => (await storagePromise).getFiles(userId),
  getFile: async (id) => (await storagePromise).getFile(id),
  createFile: async (file) => (await storagePromise).createFile(file),
  updateFile: async (id, updates) => (await storagePromise).updateFile(id, updates),
  deleteFile: async (id) => (await storagePromise).deleteFile(id),
  createAccessLog: async (log) => (await storagePromise).createAccessLog(log),
  getFileAccessLogs: async (fileId, limit) => (await storagePromise).getFileAccessLogs(fileId, limit),
};