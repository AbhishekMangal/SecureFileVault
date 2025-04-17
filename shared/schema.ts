import { pgTable, text, serial, integer, timestamp, foreignKey, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  publicKey: text("public_key"),
  privateKey: text("private_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  hash: text("hash").notNull(), // SHA-256 hash for integrity verification
  encrypted: boolean("encrypted").default(true).notNull(),
  encryptionType: text("encryption_type").default("AES-256"),
  iv: text("iv"), // Initialization vector for encryption
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Shared files
export const sharedFiles = pgTable("shared_files", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => files.id, { onDelete: "cascade" }),
  sharedByUserId: integer("shared_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sharedWithUserId: integer("shared_with_user_id").notNull().references(() => users.id),
  permissionLevel: text("permission_level").default("view").notNull(), // view, download, full
  note: text("note"),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
  viewed: boolean("viewed").default(false).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  userId: true,
  name: true,
  originalName: true,
  type: true,
  size: true,
  hash: true,
  encrypted: true,
  encryptionType: true,
  iv: true,
});

export const insertSharedFileSchema = createInsertSchema(sharedFiles).pick({
  fileId: true,
  sharedByUserId: true,
  sharedWithUserId: true,
  permissionLevel: true,
  note: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type SharedFile = typeof sharedFiles.$inferSelect;
export type InsertSharedFile = z.infer<typeof insertSharedFileSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration schema with validation
export const registrationSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  terms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.any(),
  encrypt: z.boolean().default(true),
});

// Share file schema
export const shareFileSchema = z.object({
  fileId: z.number(),
  sharedWithUserIds: z.array(z.number()),
  permissionLevel: z.enum(["view", "download", "full"]),
  note: z.string().optional(),
});
