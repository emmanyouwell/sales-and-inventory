import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import {
  type User,
  type InsertUser,
  type Session,
  type RegisterRequest,
  type Product,
  type InsertProduct,
  type UpdateProduct,
} from "../shared/schema.js";

/* -------------------- GLOBAL MONGO CONNECTION -------------------- */
let cached = (global as any)._mongoConnection;
if (!cached) {
  cached = (global as any)._mongoConnection = { conn: null, promise: null };
}

export async function connectDB(uri: string) {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

/* -------------------- SCHEMAS -------------------- */
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  role: { type: String, default: "Admin" },
  supply: String,
  supplyQuantity: Number,
  loginAttempts: { type: Number, default: 0 },
  lastFailedLogin: Date,
  cooldownUntil: Date,
  createdAt: { type: Date, default: () => new Date() },
}, { versionKey: false });
const UserModel = model("User", UserSchema);

const ProductSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, default: 0 },
  quantity: { type: Number, required: true },
  weighted: { type: Boolean, default: false },
  category: { type: String, required: true, default: "Uncategorized" },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
}, { versionKey: false });
const ProductModel = model("Product", ProductSchema);

const SaleSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantitySold: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: () => new Date() },
}, { versionKey: false });
const SaleModel = model("Sale", SaleSchema);

const SessionSchema = new Schema({
  id: { type: String, unique: true, index: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: () => new Date() },
}, { versionKey: false });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const SessionModel = model("Session", SessionSchema);

/* -------------------- MAPPERS -------------------- */
function mapUser(doc: any): User {
  if (!doc) return undefined as any;
  return {
    id: doc._id.toString(),
    username: doc.username,
    password: doc.password,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    role: doc.role,
    supply: doc.supply,
    supplyQuantity: doc.supplyQuantity,
    loginAttempts: doc.loginAttempts ?? 0,
    lastFailedLogin: doc.lastFailedLogin ?? null,
    cooldownUntil: doc.cooldownUntil ?? null,
    createdAt: doc.createdAt ?? new Date(),
  };
}

function mapProduct(doc: any): Product {
  if (!doc) return undefined as any;
  return {
    id: doc.id || doc._id.toString(),
    name: doc.name,
    description: doc.description || "",
    price: doc.price || 0,
    quantity: doc.quantity || 0,
    weighted: doc.weighted || false,
    category: doc.category || "Uncategorized",
    createdAt: doc.createdAt || new Date(),
    updatedAt: doc.updatedAt || new Date(),
  };
}

function mapSession(doc: any): Session {
  return {
    id: doc.id,
    userId: doc.userId,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  };
}

/* -------------------- STORAGE CLASS -------------------- */
class MongoStorage {
  /* USERS */
  async getUser(id: string) { const doc = await UserModel.findById(id).lean(); return doc ? mapUser(doc) : undefined; }
  async getUserByUsername(username: string) { const doc = await UserModel.findOne({ username }).lean(); return doc ? mapUser(doc) : undefined; }
  async createUser(user: InsertUser) { const hashed = await bcrypt.hash(user.password, 10); const doc = await UserModel.create({ ...user, password: hashed }); return mapUser(doc); }
  async registerUser(userData: Omit<RegisterRequest, "confirmPassword">) { if (await UserModel.exists({ username: userData.username })) throw new Error("Username already exists"); const hashed = await bcrypt.hash(userData.password, 10); const doc = await UserModel.create({ ...userData, password: hashed }); return mapUser(doc); }
  async updateUser(id: string, updates: Partial<User>) { const doc = await UserModel.findByIdAndUpdate(id, updates, { new: true }).lean(); return doc ? mapUser(doc) : undefined; }
  async getAllUsers() { const docs = await UserModel.find({ role: { $in: ["staff", "supplier"] } }).lean(); return docs.map(mapUser); }
  async updateUserPassword(username: string, hashed: string) { await UserModel.updateOne({ username }, { password: hashed }); }
  async unlockUserAccount(username: string) { await UserModel.updateOne({ username }, { loginAttempts: 0, cooldownUntil: null }); }
  async incrementLoginAttempts(username: string) { await UserModel.updateOne({ username }, { $inc: { loginAttempts: 1 }, $set: { lastFailedLogin: new Date() } }); }
  async resetLoginAttempts(username: string) { await UserModel.updateOne({ username }, { loginAttempts: 0, cooldownUntil: null, lastFailedLogin: null }); }
  async setCooldown(username: string, cooldownUntil: Date | null) { await UserModel.updateOne({ username }, { cooldownUntil }); }
  async clearCooldown(username: string) { await UserModel.updateOne({ username }, { cooldownUntil: null }); }

  /* PRODUCTS */
  async getAllProducts() { const docs = await ProductModel.find({}).lean(); return docs.map(mapProduct); }
  async getProductByManualId(id: string) { let doc = await ProductModel.findOne({ id }).lean(); if (!doc && /^[0-9a-fA-F]{24}$/.test(id)) doc = await ProductModel.findById(id).lean(); return doc ? mapProduct(doc) : undefined; }
  async getProduct(id: string) { const doc = await ProductModel.findOne({ id }).lean(); return doc ? mapProduct(doc) : undefined; }
  async createProduct(productData: InsertProduct) { const id = productData.id ?? randomUUID(); const doc = await ProductModel.create({ ...productData, id, createdAt: new Date(), updatedAt: new Date() }); return mapProduct(doc); }
  async updateProduct(id: string, updates: UpdateProduct) { const doc = await ProductModel.findOneAndUpdate({ id }, { ...updates, updatedAt: new Date() }, { new: true }).lean(); return doc ? mapProduct(doc) : undefined; }
  async deleteProduct(id: string) { const res = await ProductModel.deleteOne({ id }); return res.deletedCount === 1; }
  async deductProductStock(id: string, quantity: number) {
    const product = await ProductModel.findOne({ id });
    if (!product) throw new Error("Product not found");
    product.quantity = Math.max(0, (product.quantity ?? 0) - quantity);
    product.updatedAt = new Date();
    await product.save();
    await SaleModel.create({
      productId: product.id,
      productName: product.name,
      quantitySold: quantity,
      totalPrice: (product.price ?? 0) * quantity,
      createdAt: new Date(),
    });
  }

  /* REPORTS */
  async getSalesReport(period: "daily" | "weekly") {
    const now = new Date();
    const startDate = period === "daily"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    const sales = await SaleModel.find({ createdAt: { $gte: startDate } }).lean();
    const totalProductsSold = sales.reduce((sum, s) => sum + s.quantitySold, 0);
    const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const lowStockProducts = await ProductModel.find({ quantity: { $lt: 10 } }).lean();
    return {
      totalProductsSold,
      totalSales,
      lowStockProducts: lowStockProducts.map(mapProduct),
      timestamp: new Date().toLocaleString(),
    };
  }

  /* SESSIONS */
  async createSession(userId: string) { const id = randomUUID(); const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); const doc = await SessionModel.create({ id, userId, expiresAt }); return mapSession(doc); }
  async getSession(sessionId: string) { const doc = await SessionModel.findOne({ id: sessionId }).lean(); return doc ? mapSession(doc) : undefined; }
  async deleteSession(sessionId: string) { const res = await SessionModel.deleteOne({ id: sessionId }); return res.deletedCount === 1; }
}

export const storage = new MongoStorage();
