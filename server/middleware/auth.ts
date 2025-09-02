import { Request, Response, NextFunction } from 'express';
import { supabase } from '../routes'; // Assuming supabase is exported from routes.ts

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string };
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided or invalid format.' });
    }

    const token = authHeader.split(' ')[1];
    
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.error('Supabase authentication error:', error?.message);
      return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }

    req.user = { id: data.user.id };
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
};
