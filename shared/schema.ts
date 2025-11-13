// src/shared/schema.ts
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { string, z } from "zod";

/* ========================
   USERS TABLE
======================== */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("Admin"),
  supply: text("supply"),
  supplyQuantity: integer("supply_quantity"),
  loginAttempts: integer("login_attempts").default(0),
  lastFailedLogin: timestamp("last_failed_login"),
  cooldownUntil: timestamp("cooldown_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ========================
   SESSIONS TABLE
======================== */
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ========================
   PRODUCTS TABLE
======================== */
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull().default(0),
  quantity: integer("quantity").notNull().default(0),
  weighted: boolean("weighted").default(false),
  category: text("category").notNull().default("Uncategorized"), // ✅ new column
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* ========================
   USER SCHEMAS
======================== */
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  loginAttempts: true,
  lastFailedLogin: true,
  cooldownUntil: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(1, "Username is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must include uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string(),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^[0-9]{11}$/, "Phone number must be 11 digits"),
    role: z.enum(["user", "staff", "admin", "supplier"]).default("user"),
    supply: z.string().optional(),
    supplyQuantity: z.coerce.number().positive().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === "supplier") {
        return data.supply && data.supplyQuantity;
      }
      return true;
    },
    {
      message: "Supply and quantity are required for suppliers",
      path: ["supply"],
    }
  );

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[0-9]{11}$/).optional(),
  supply: z.string().optional(),
  supplyQuantity: z.number().positive().optional(),
});

/* ========================
   PRODUCT SCHEMAS
======================== */
export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    id: string(),
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be non-negative"),
    quantity: z.number().min(0, "Quantity must be non-negative"),
    weighted: z.boolean().default(false),
    category: z.string().min(1, "Category is required").default("Uncategorized"),
  });

export const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  quantity: z.number().min(0, "Quantity must be non-negative").optional(),
  weighted: z.boolean().optional(),
  category: z.string().optional(),
});

/* ========================
   TYPES
======================== */
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
