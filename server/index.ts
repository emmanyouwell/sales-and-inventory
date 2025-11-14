// server/index.ts
import express, { type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

import { setupVite, serveStatic, log } from "./vite.js";

const BASE_API_URL = "https://sales-inventory-management.onrender.com"; // Render backend

/* ============================================================
   APP INITIALIZATION
============================================================ */
const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`;
      if (capturedJsonResponse) {
        try {
          const jsonStr = JSON.stringify(capturedJsonResponse);
          logLine += ` :: ${jsonStr.length > 80 ? jsonStr.slice(0, 79) + "…" : jsonStr}`;
        } catch {
          logLine += " :: [unserializable JSON]";
        }
      }
      log(logLine);
    }
  });

  next();
});

/* ============================================================
   FRONTEND SETUP
============================================================ */
let frontendReady = false;

async function setupFrontend() {
  if (frontendReady) return;

  if (process.env.NODE_ENV === "development") {
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
  console.error("💥 Server error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

/* ============================================================
   PROXY ALL /api REQUESTS TO RENDER BACKEND
============================================================ */

app.use("/api", async (req: Request, res: Response) => {
  try {
    const url = `${BASE_API_URL}${req.originalUrl}`;
    const options: any = {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        cookie: req.headers.cookie || "",
      },
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      options.body = JSON.stringify(req.body);
    }

    const backendRes = await fetch(url, options);
    const data = await backendRes.text();

    res.status(backendRes.status);

    try {
      // Try parsing JSON
      res.json(JSON.parse(data));
    } catch {
      // If not JSON, just return text
      res.send(data);
    }
  } catch (err) {
    console.error("💥 API proxy error:", err);
    res.status(500).json({ message: "API proxy failed" });
  }
});

/* ============================================================
   SERVER STARTUP
============================================================ */
const port = process.env.PORT || 3000;

(async () => {
  try {
    await setupFrontend();

    app.listen(port, () => {
      console.log(`🚀 Frontend server running on port ${port}`);
      console.log(`🌐 All /api requests are proxied to ${BASE_API_URL}`);
    });
  } catch (err) {
    console.error("🔥 Failed to start server:", err);
    process.exit(1);
  }
})();
