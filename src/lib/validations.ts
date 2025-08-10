
import { z } from 'zod';

// Design element validation schemas
export const DesignElementSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['text', 'image', 'shape', 'line']),
  x: z.number().min(0).max(5000),
  y: z.number().min(0).max(5000),
  width: z.number().min(1).max(5000),
  height: z.number().min(1).max(5000),
  rotation: z.number().min(-360).max(360),
  zIndex: z.number().min(0),
  content: z.string().max(1000).optional(),
  fontSize: z.number().min(8).max(200).optional(),
  fontFamily: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderWidth: z.number().min(0).max(20).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const DesignSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  width: z.number().min(100).max(5000),
  height: z.number().min(100).max(5000),
  elements: z.array(DesignElementSchema),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Blog validation schemas
export const BlogCommentSchema = z.object({
  content: z.string().min(1).max(500),
  postId: z.string().uuid(),
  authorName: z.string().min(1).max(100).optional(),
  authorEmail: z.string().email().optional(),
});

export const BlogPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  excerpt: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  author: z.string().min(1).max(100),
  published: z.boolean(),
  publishedAt: z.date().optional(),
  slug: z.string().min(1).max(200),
});

// File upload validation
export const FileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, GIF, and WebP files are allowed'
    ),
});

// User input validation
export const UserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(100).optional(),
});

// Validation helper functions
export function validateDesignElement(data: unknown) {
  return DesignElementSchema.safeParse(data);
}

export function validateDesign(data: unknown) {
  return DesignSchema.safeParse(data);
}

export function validateBlogComment(data: unknown) {
  return BlogCommentSchema.safeParse(data);
}

export function validateBlogPost(data: unknown) {
  return BlogPostSchema.safeParse(data);
}

export function validateFileUpload(data: unknown) {
  return FileUploadSchema.safeParse(data);
}

export function validateUserInput(data: unknown) {
  return UserInputSchema.safeParse(data);
}
