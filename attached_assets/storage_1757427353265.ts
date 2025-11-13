import { type User, type InsertUser, type Session, type RegisterRequest, type Product, type InsertProduct, type UpdateProduct } from "../shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  registerUser(userData: Omit<RegisterRequest, "confirmPassword">): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  createSession(userId: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
  incrementLoginAttempts(username: string): Promise<void>;
  resetLoginAttempts(username: string): Promise<void>;
  setCooldown(username: string, cooldownUntil: Date): Promise<void>;
  
  // Product management
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: UpdateProduct): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private products: Map<string, Product>;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.products = new Map();
    this.seedUsers();
    this.seedProducts();
  }

  private async seedUsers() {
    // Create demo users
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: await bcrypt.hash("admin123", 10),
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      phone: null,
      role: "admin",
      supply: null,
      supplyQuantity: null,
      loginAttempts: 0,
      lastFailedLogin: null,
      cooldownUntil: null,
      createdAt: new Date(),
    };

    const regularUser: User = {
      id: randomUUID(),
      username: "user",
      password: await bcrypt.hash("user123", 10),
      firstName: "John",
      lastName: "Doe",
      email: "user@example.com",
      phone: null,
      role: "user",
      supply: null,
      supplyQuantity: null,
      loginAttempts: 0,
      lastFailedLogin: null,
      cooldownUntil: null,
      createdAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(regularUser.id, regularUser);
  }

  private seedProducts() {
    // Create demo products
    const products = [
      { id: randomUUID(), name: "Laptop", quantity: 15, createdAt: new Date(), updatedAt: new Date(),  description: "High-end gaming laptop",
      price: 1500,
      weighted: null,
      category: "Electronics", },
      { id: randomUUID(), name: "Mouse", quantity: 45, createdAt: new Date(), updatedAt: new Date(), description: "Wireless mouse",
      price: 25,
      weighted: null,
      category: "Electronics" },
      { id: randomUUID(), name: "Keyboard", quantity: 8, createdAt: new Date(), updatedAt: new Date(),  description: "Mechanical keyboard",
      price: 80,
      weighted: null,
      category: "Electronics", },
      { id: randomUUID(), name: "Monitor", quantity: 25, createdAt: new Date(), updatedAt: new Date() ,  description: "24-inch monitor",
      price: 200,
      weighted: null,
      category: "Electronics", },
      { id: randomUUID(), name: "Headphones", quantity: 3, createdAt: new Date(), updatedAt: new Date(), description: "Noise-cancelling headphones",
      price: 120,
      weighted: null,
      category: "Electronics", },
    ];

    products.forEach(product => {
      return this.products.set(product.id, product);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = { 
      id, 
      username: insertUser.username,
      password: hashedPassword,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      email: insertUser.email || null,
      phone: insertUser.phone || null,
      role: insertUser.role || "user",
      supply: insertUser.supply || null,
      supplyQuantity: insertUser.supplyQuantity || null,
      loginAttempts: 0,
      lastFailedLogin: null,
      cooldownUntil: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async registerUser(userData: Omit<RegisterRequest, "confirmPassword">): Promise<User> {
    // Check if username already exists
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user: User = {
      id,
      username: userData.username,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      supply: userData.supply || null,
      supplyQuantity: userData.supplyQuantity || null,
      loginAttempts: 0,
      lastFailedLogin: null,
      cooldownUntil: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createSession(userId: string): Promise<Session> {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session: Session = {
      id: sessionId,
      userId,
      expiresAt,
      createdAt: new Date(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    
    return session;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async incrementLoginAttempts(username: string): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (user) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();
      this.users.set(user.id, user);
    }
  }

  async resetLoginAttempts(username: string): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (user) {
      user.loginAttempts = 0;
      user.lastFailedLogin = null;
      user.cooldownUntil = null;
      this.users.set(user.id, user);
    }
  }

  async setCooldown(username: string, cooldownUntil: Date): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (user) {
      user.cooldownUntil = cooldownUntil;
      this.users.set(user.id, user);
    }
  }

  // Product management methods
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      id,
      name: productData.name,
      quantity: productData.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: null,
      price: 0,
      weighted: null,
      category: ""
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: UpdateProduct): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct: Product = {
      ...product,
      ...updates,
      updatedAt: new Date(),
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }
}

export const storage = new MemStorage();
