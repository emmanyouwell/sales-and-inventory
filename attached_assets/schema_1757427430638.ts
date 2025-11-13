import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";


export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("user"),
  supply: text("supply"),
  supplyQuantity: integer("supply_quantity"),
  loginAttempts: integer("login_attempts").default(0),
  lastFailedLogin: timestamp("last_failed_login"),
  cooldownUntil: timestamp("cooldown_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// User insert
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  loginAttempts: true,
  lastFailedLogin: true,
  cooldownUntil: true,
});

// Login
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Register
export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must include uppercase, lowercase, and number"),
  confirmPassword: z.string(),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[0-9]{11}$/, "Phone number must be 11 digits"),
  role: z.enum(["user", "staff", "admin", "supplier"]).default("user"),
  supply: z.string().optional(),
  supplyQuantity: z.number().positive().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "supplier") {
    return data.supply && data.supplyQuantity;
  }
  return true;
}, {
  message: "Supply and quantity are required for suppliers",
  path: ["supply"],
});

// Update profile
export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[0-9]{11}$/).optional(),
  supply: z.string().optional(),
  supplyQuantity: z.number().positive().optional(),
});

//INSERT PRODUCT
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  quantity: z.number().min(0, "Quantity must be non-negative"),
});


export const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  quantity: z.number().min(0, "Quantity must be non-negative").optional(),
});
