import express from "express";
import { registerRoutes } from "./routes";
import * as dotenv from 'dotenv';

import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string };
  }
}

dotenv.config();

console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
  SERVER_PORT: process.env.PORT || 5001,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
});

const app = express();

// ✅ Custom middleware to handle CORS without 'cors' package
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173"); // or "*"
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

import briefsRouter from './api/briefs';
app.use('/briefs', briefsRouter);

(async () => {
  const server = await registerRoutes(app);

  const PORT = parseInt(process.env.PORT || '5001', 10);

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
