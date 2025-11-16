import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
dotenv.config();

import { registerRoutes } from './routes.js';
import { setupVite, serveStatic, log } from './vite.js';

/* ============================================================
   DEPLOYED BACKEND URL (Render)
============================================================ */
export const BASE_API_URL = 'https://sales-inventory-management.onrender.com';

/* ============================================================
   APP INITIALIZATION
============================================================ */
const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ============================================================
   FIXED CORS (Vercel + Render + Cookies)
============================================================ */
const allowedOrigins = [
  'https://sales-and-inventory-zeta.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000', // Main entry point for backend and frontend
];

// CORS options
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser tools
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Main cors policy
app.use(cors(corsOptions));

// Preflight (must match the above CORS config)
app.options('*', cors(corsOptions));

/* ============================================================
   LOGGING MIDDLEWARE
============================================================ */
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${
        Date.now() - start
      }ms`;

      if (capturedJsonResponse) {
        try {
          const jsonStr = JSON.stringify(capturedJsonResponse);
          logLine += ` :: ${
            jsonStr.length > 80 ? jsonStr.slice(0, 79) + '…' : jsonStr
          }`;
        } catch {
          logLine += ' :: [unserializable JSON]';
        }
      }

      log(logLine);
    }
  });

  next();
});

/* ============================================================
   MONGODB CONNECTION
============================================================ */
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    const uri =
      process.env.MONGO_URI ||
      'mongodb+srv://mdaviddd:mdaviddd123@cluster0.th1nuox.mongodb.net/sales-inventory-management';

    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    log('✅ MongoDB connected');
    isConnected = true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw new Error('Database connection failed');
  }
}

/* ============================================================
   API ROUTES
============================================================ */
registerRoutes(app);

/* ============================================================
   FRONTEND SETUP
============================================================ */
let frontendReady = false;

async function setupFrontend() {
  if (frontendReady) return;

  if (process.env.NODE_ENV === 'development') {
    await setupVite(app);
  } else {
    serveStatic(app);
  }

  frontendReady = true;
}

/* ============================================================
   GLOBAL ERROR HANDLER
============================================================ */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

/* ============================================================
   SERVERLESS HANDLER (Vercel ONLY)
============================================================ */
export default async function handler(req: Request, res: Response) {
  try {
    await connectDB();
    await setupFrontend();
    return app(req, res);
  } catch (err) {
    console.error('💥 Serverless handler error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ============================================================
   NORMAL NODE SERVER (Render / Local)
============================================================ */
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;

  (async () => {
    try {
      await connectDB();
      await setupFrontend();

      app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
      });
    } catch (err) {
      console.error('🔥 Failed to start server:', err);
      process.exit(1);
    }
  })();
}
