import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";
import * as dotenv from 'dotenv';

import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string };
  }
}
// Load environment variables from the project root's .env file
dotenv.config({ path: '../.env' });

// Add environment check logging
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
  SERVER_PORT: process.env.PORT || 3001,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
});

const app = express();
import { initializeDbAndSupabase, supabase } from "./db.js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL; // Optional, for direct Drizzle connection

initializeDbAndSupabase(supabaseUrl, supabaseKey, databaseUrl);

app.use(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!supabase) {
    console.warn('Authentication middleware: Supabase client is not initialized.');
    req.user = undefined; // Ensure user is undefined if Supabase is not available
    return next();
  }

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      console.log('Authentication middleware: Token received.');
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
          console.error('Authentication middleware: Error getting user from token:', error.message);
          // Do not throw error here, just log and proceed without user
        }
        req.user = user ? { id: user.id } : undefined;
        console.log('Authentication middleware: User ID set:', req.user?.id);
      } catch (error) {
        console.error('Authentication middleware: Error authenticating user:', error);
      }
    } else {
      console.log('Authentication middleware: No token part found in Authorization header.');
    }
  } else {
    console.log('Authentication middleware: No Authorization header found.');
  }
  next();
});

// Configure CORS before any routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3001/api/briefs',
    'http://0.0.0.0:5173',
    'http://0.0.0.0:5174',
    'http://localhost:4000'
  ]);
  if (origin && allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown = undefined;

  const originalResJson = res.json;
  res.json = function (this: Response, bodyJson: unknown) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(this, [bodyJson]);
  } as typeof originalResJson;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

import briefsRouter from './api/briefs'; // Moved to here after dotenv.config()
// Mount the briefs router
app.use('/api/briefs', briefsRouter);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: Error, _req: Request, res: Response) => { // Removed _next as it's not used
    const status = (err as { status?: number, statusCode?: number }).status || (err as { status?: number, statusCode?: number }).statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Simplified for testing - removed Vite integration
  // if (app.get("env") === "development") {
  //   await setupVite(app, server);
  // } else {
  //   serveStatic(app);
  // }

  const PORT = parseInt(process.env.PORT || '3001', 10);

  const startServer = async (port: number): Promise<void> => {
    try {
      await new Promise((resolve, reject) => {
        server.listen(port, "127.0.0.1", () => resolve(undefined))
          .on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
              console.log(`Port ${port} is in use, trying ${port + 1}`);
              server.close();
              startServer(port + 1).then(() => resolve(undefined)).catch(reject);
            } else {
              reject(error);
            }
          });
      });
      console.log(`Server running on port ${port}`);
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  await startServer(PORT);
})();