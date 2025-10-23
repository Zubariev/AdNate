/**
 * Aspect Ratio Utilities for Gemini Image Generation
 * Maps pixel dimensions to supported Gemini aspect ratios
 */

interface AspectRatioDefinition {
  name: string;
  value: number;
}

// Supported Gemini aspect ratios
const ASPECT_RATIOS: AspectRatioDefinition[] = [
  { name: "1:1", value: 1.0 },
  { name: "21:9", value: 21/9 },
  { name: "16:9", value: 16/9 },
  { name: "4:3", value: 4/3 },
  { name: "3:2", value: 3/2 },
  { name: "9:16", value: 9/16 },
  { name: "3:4", value: 3/4 },
  { name: "2:3", value: 2/3 },
  { name: "5:4", value: 5/4 },
  { name: "4:5", value: 4/5 }
];

/**
 * Parse dimension string like "1200x630" into width and height
 */
export function parseDimensions(sizeStr: string): { width: number; height: number } | null {
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
 * Calculate aspect ratio as a decimal number
 */
export function calculateAspectRatio(width: number, height: number): number {
  if (height === 0) {
    return 1.0;
  }
  return width / height;
}

/**
 * Find the closest supported Gemini aspect ratio for a given ratio
 */
export function findClosestAspectRatio(targetRatio: number): string {
  if (!targetRatio || targetRatio <= 0) {
    return "16:9"; // Default fallback
  }
  
  let closest = ASPECT_RATIOS[0];
  let minDiff = Math.abs(targetRatio - closest.value);
  
  for (const ratio of ASPECT_RATIOS) {
    const diff = Math.abs(targetRatio - ratio.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = ratio;
    }
  }
  
  return closest.name;
}

/**
 * Get aspect ratio name from dimension string
 */
export function getAspectRatioFromDimensions(sizeStr: string): string {
  const dimensions = parseDimensions(sizeStr);
  if (!dimensions) {
    return "16:9"; // Default fallback
  }
  
  const ratio = calculateAspectRatio(dimensions.width, dimensions.height);
  return findClosestAspectRatio(ratio);
}

/**
 * Format dimensions back to string
 */
export function formatDimensions(width: number, height: number): string {
  return `${width}x${height}`;
}

