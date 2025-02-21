
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  private getKey(userId?: string, ip?: string, endpoint?: string): string {
    return `${userId || 'anonymous'}:${ip || 'unknown'}:${endpoint || 'general'}`;
  }

  public checkLimit(userId?: string, ip?: string, endpoint?: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const key = this.getKey(userId, ip, endpoint);
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  public getRemainingTime(userId?: string, ip?: string, endpoint?: string): number {
    const key = this.getKey(userId, ip, endpoint);
    const entry = this.limits.get(key);
    
    if (!entry) return 0;
    
    return Math.max(0, entry.resetTime - Date.now());
  }
}

// Create different rate limiters for different operations
export const generalRateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
export const apiRateLimiter = new RateLimiter(50, 60 * 1000); // 50 API calls per minute
export const uploadRateLimiter = new RateLimiter(10, 60 * 1000); // 10 uploads per minute
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 auth attempts per 15 minutes

// Helper function to check rate limit and throw error if exceeded
export function enforceRateLimit(
  limiter: RateLimiter,
  userId?: string,
  ip?: string,
  endpoint?: string
): void {
  const result = limiter.checkLimit(userId, ip, endpoint);
  
  if (!result.allowed) {
    const remainingTime = Math.ceil(result.resetTime - Date.now()) / 1000;
    throw new Error(`Rate limit exceeded. Try again in ${remainingTime} seconds.`);
  }
}
