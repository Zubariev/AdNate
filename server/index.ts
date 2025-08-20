import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';
import cors from 'cors';
import briefsRouter from './api/briefs';

// Load environment variables from multiple locations
dotenv.config({ path: '../.env.local' }); // Try .env.local in parent directory first
dotenv.config({ path: '../.env' }); // Try .env in parent directory
dotenv.config({ path: '.env.local' }); // Try .env.local in current directory
dotenv.config(); // Try .env in current directory

// Add environment check logging
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
  SERVER_PORT: process.env.PORT || 3001
});

const app = express();

// Configure CORS before any routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://0.0.0.0:5173'
  ]);
  if (origin && allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

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

// Mount the briefs router
app.use('/api/briefs', briefsRouter);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
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