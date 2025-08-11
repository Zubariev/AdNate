import DOMPurify from 'dompurify';

// Configuration for different content types
const BLOG_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
  ],
  ALLOWED_ATTR: {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class']
  },
  ALLOW_DATA_ATTR: false,
};

const COMMENT_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code'],
  ALLOWED_ATTR: {},
  ALLOW_DATA_ATTR: false,
};

const STRICT_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: {},
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
};

/**
 * Sanitize HTML content for blog posts
 */
export function sanitizeBlogContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
}

/**
 * Sanitize HTML content for comments
 */
export function sanitizeCommentContent(html: string): string {
  return DOMPurify.sanitize(html, COMMENT_CONFIG);
}

/**
 * Sanitize text content (remove all HTML)
 */
export function sanitizeText(text: string): string {
  // Remove potentially dangerous characters and limit special characters
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .trim();
}

/**
 * Sanitize user input for design elements
 */
export function sanitizeDesignText(text: string): string {
  // For design elements, we want to strip HTML but keep the text
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: {},
    KEEP_CONTENT: true,
  });
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Escape special characters for use in regex
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}