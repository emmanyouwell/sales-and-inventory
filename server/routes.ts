import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { ZodError } from "zod";
import { storage } from "./storage.js";
import { loginSchema, registerSchema } from "../shared/schema.js";
import cors from "cors";
import cookieParser from "cookie-parser";

/**
 * Registers all API routes
 */
export function registerRoutes(app: Express) {
  console.log("🛠️ Registering API routes...");

  // -------------------- SESSION: CURRENT USER --------------------
  app.get("/api/me", async (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (!sessionId) return res.status(401).json({ message: "Not logged in" });

      const session = await storage.getSession(sessionId);
      if (!session) return res.status(401).json({ message: "Invalid session" });

      const user = await storage.getUser(session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { password, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (err) {
      console.error("/api/me error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // -------------------- LOGIN --------------------
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      if (user.cooldownUntil && user.cooldownUntil > new Date()) {
        const remaining = Math.ceil((user.cooldownUntil.getTime() - Date.now()) / 1000);
        return res.status(429).json({
          message: "Account temporarily locked. Try again later.",
          remainingSeconds: remaining,
        });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        await storage.incrementLoginAttempts(username);

        if ((user.loginAttempts || 0) >= 2) {
          const cooldownUntil = new Date(Date.now() + 5 * 60 * 1000);
          await storage.setCooldown(username, cooldownUntil);
          return res.status(429).json({
            message: "Too many failed attempts. Account locked for 5 minutes.",
            cooldownUntil,
          });
        }

        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.resetLoginAttempts(username);
      const session = await storage.createSession(user.id);

      res.cookie("sessionId", session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // necessary for cross-origin cookies
        maxAge: 24 * 60 * 60 * 1000,
      });

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser, session });
    } catch (err) {
      console.error("Login error:", err);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // -------------------- REGISTER --------------------
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userData = registerSchema.parse(req.body);
      const { confirmPassword, ...cleanData } = userData;
      const user = await storage.registerUser(cleanData);
      const { password: _, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      if (error.message === "Username already exists") {
        return res.status(409).json({ message: error.message });
      }
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // -------------------- LOGOUT --------------------
  app.post("/api/logout", async (req: Request, res: Response) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) await storage.deleteSession(sessionId);
    res.clearCookie("sessionId", { sameSite: "none", secure: process.env.NODE_ENV === "production" });
    res.json({ message: "Logged out successfully" });
  });

  // -------------------- OTHER ROUTES --------------------
  // ... Keep all your products, sales, admin routes as-is
 app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product =
        (await storage.getProductByManualId(req.params.id)) ||
        (await storage.getProduct(req.params.id));
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      if (!req.body.id) return res.status(400).json({ message: "Product ID required" });
      const existing = await storage.getProductByManualId?.(req.body.id);
      if (existing) return res.status(409).json({ message: "Product ID exists" });
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch {
      res.status(500).json({ message: "Failed to add product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const updated = await storage.updateProduct(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Product not found" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) return res.status(404).json({ message: "Product not found" });
      res.json({ message: "Product deleted" });
    } catch {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.post("/api/products/:id/deduct", async (req, res) => {
    try {
      const { quantity } = req.body;
      const productId = req.params.id;

      const product =
        (await storage.getProductByManualId(productId)) ||
        (await storage.getProduct(productId));

      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.quantity < quantity)
        return res.status(400).json({ message: "Insufficient stock" });

      await storage.deductProductStock(product.id, quantity);
      const updated = await storage.getProduct(product.id);

      res.json({
        message: `Deducted ${quantity} item(s).`,
        product: updated,
      });
    } catch {
      res.status(500).json({ message: "Failed to deduct stock" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json({ message: "No sale items provided" });

      let totalAmount = 0;
      const saleRecords = [];

      for (const item of items) {
        const product =
          (await storage.getProductByManualId(item.id)) ||
          (await storage.getProduct(item.id));

        if (!product)
          return res.status(404).json({ message: `Product not found: ${item.id}` });
        if (product.quantity < item.quantity)
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}`,
          });

        await storage.deductProductStock(product.id, item.quantity);
        totalAmount += product.price * item.quantity;

        saleRecords.push({
          productId: product.id,
          productName: product.name,
          quantitySold: item.quantity,
          totalPrice: product.price * item.quantity,
        });
      }

      res.json({
        message: "Transaction completed.",
        totalAmount,
        saleRecords,
      });
    } catch {
      res.status(500).json({ message: "Failed to complete sale" });
    }
  });

  app.get("/api/sales", async (_req, res) => {
    try {
      const sales = await storage.getSalesReport("daily");
      res.json(sales);
    } catch {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/reports/:period", async (req, res) => {
    try {
      const period = req.params.period === "weekly" ? "weekly" : "daily";
      const report = await storage.getSalesReport(period);
      res.json(report);
    } catch {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });
  
}
