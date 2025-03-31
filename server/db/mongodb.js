import mongoose from 'mongoose';
import { log } from '../vite.js';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure-transfer';

// Schema definitions
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const FileSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  filename: { type: String, required: true },
  originalFilename: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  type: { type: String, required: true },
  isEncrypted: { type: Boolean, default: true },
  encryptionKey: { type: String },
  encryptionIV: { type: String },
  hash: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastAccessed: { type: Date, default: Date.now }
});

const AccessLogSchema = new mongoose.Schema({
  fileId: { type: Number, required: true, index: true },
  userId: { type: Number, required: true },
  ipAddress: { type: String, required: true },
  action: { type: String, required: true, enum: ['upload', 'download', 'delete', 'view'] },
  timestamp: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', UserSchema);
const File = mongoose.model('File', FileSchema);
const AccessLog = mongoose.model('AccessLog', AccessLogSchema);

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB database', 'mongodb');
    return { User, File, AccessLog };
  } catch (error) {
    log(`MongoDB connection error: ${error.message}`, 'mongodb');
    // Fall back to in-memory storage if MongoDB connection fails
    return null;
  }
}

export const models = { User, File, AccessLog };