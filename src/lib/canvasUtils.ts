/**
 * Canvas Utilities for Banner Size Parsing
 * Frontend utilities for handling banner dimensions
 */

/**
 * Parse banner size string like "1200x630" into width and height
 */
export function parseBannerSize(sizeStr: string): { width: number; height: number } | null {
  if (!sizeStr || typeof sizeStr !== 'string') {
    return null;
  }
  
  const parts = sizeStr.trim().split('x');
  if (parts.length !== 2) {
    return null;
  }
  
  const width = parseInt(parts[0], 10);
  const height = parseInt(parts[1], 10);
  
  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    return null;
  }
  
  return { width, height };
}

/**
 * Format dimensions back to string
 */
export function formatBannerSize(width: number, height: number): string {
  return `${width}x${height}`;
}

/**
 * Get default canvas size if banner size is not available
 */
export function getDefaultCanvasSize(): { width: number; height: number } {
  return { width: 1200, height: 630 }; // Default to common social media size (16:9)
}

/**
 * Validate canvas dimensions are within reasonable limits
 */
export function validateCanvasSize(size: { width: number; height: number }): boolean {
  const minSize = 100;
  const maxSize = 10000;
  
  return size.width >= minSize && size.width <= maxSize &&
         size.height >= minSize && size.height <= maxSize;
}

