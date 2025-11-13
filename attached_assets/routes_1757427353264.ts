import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../server/storage";
import { loginSchema, registerSchema, updateProfileSchema, insertProductSchema, updateProductSchema } from "../shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import MemoryStore from "memorystore";


const MemoryStoreSession = MemoryStore(session);

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'replace-with-a-strong-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: false, // set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const now = new Date();

      // Check cooldown
      if (user.cooldownUntil && now < user.cooldownUntil) {
        const waitMinutes = Math.ceil((user.cooldownUntil.getTime() - now.getTime()) / 60000);
        return res.status(429).json({ 
          error: `You must wait ${waitMinutes} minute(s) before logging in again.`,
          cooldownUntil: user.cooldownUntil.toISOString()
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (passwordMatch) {
        // Reset login attempts on successful login
        await storage.resetLoginAttempts(username);
        
        // Create session
        const session = await storage.createSession(user.id);
        
        // Store session info
        (req.session as any).userId = user.id;
        (req.session as any).username = user.username;
        (req.session as any).role = user.role;

        return res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      } else {
        // Increment login attempts
        await storage.incrementLoginAttempts(username);
        
        const updatedUser = await storage.getUserByUsername(username);
        const attempts = updatedUser?.loginAttempts || 0;
        
        if (attempts >= 5) {
          const cooldownUntil = new Date(now.getTime() + 5 * 60000); // 5 minutes
          await storage.setCooldown(username, cooldownUntil);
          return res.status(429).json({ 
            error: '5 failed attempts. Wait 5 minutes.',
            cooldownUntil: cooldownUntil.toISOString()
          });
        } else if (attempts >= 3) {
          const cooldownUntil = new Date(now.getTime() + 1 * 60000); // 1 minute
          await storage.setCooldown(username, cooldownUntil);
          return res.status(429).json({ 
            error: '3 failed attempts. Wait 1 minute.',
            cooldownUntil: cooldownUntil.toISOString()
          });
        }

        return res.status(401).json({ 
          error: `Invalid username or password. (${attempts}/5 attempts)`
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Server error during login' });
    }
  });

  // Get current user
  app.get('/api/me', (req, res) => {
    if (!(req.session as any)?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      id: (req.session as any).userId,
      username: (req.session as any).username,
      role: (req.session as any).role
    });
  });

  // Registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const { confirmPassword, ...userDataWithoutConfirm } = userData;
      
      const newUser = await storage.registerUser(userDataWithoutConfirm);
      
      res.json({
        success: true,
        message: 'Registration successful',
        user: {
          id: newUser.id,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error && error.message === 'Username already exists') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Get user profile
  app.get('/api/profile', async (req, res) => {
    if (!(req.session as any)?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser((req.session as any).userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove sensitive data
      const { password, loginAttempts, lastFailedLogin, cooldownUntil, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Update user profile
  app.put('/api/profile', async (req, res) => {
    if (!(req.session as any)?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const updates = updateProfileSchema.parse(req.body);
      const userId = (req.session as any).userId;
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove sensitive data
      const { password, loginAttempts, lastFailedLogin, cooldownUntil, ...userProfile } = updatedUser;
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: userProfile
      });
    } catch (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Product routes (require authentication)
  app.get('/api/products', requireAuth, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', requireAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json({ success: true, product });
    } catch (error) {
      console.error('Create product error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid product data', details: error.message });
      }
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateProductSchema.parse(req.body);
      const product = await storage.updateProduct(id, updates);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ success: true, product });
    } catch (error) {
      console.error('Update product error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid product data', details: error.message });
      }
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
