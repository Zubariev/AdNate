/**
 * Scaling Utilities for Element Specifications (Frontend)
 * Scales element dimensions and positions proportionally based on canvas size
 */

/**
 * Element specification data structure (matching backend)
 */
interface ElementSpec {
  id: string;
  name: string;
  type: string;
  purpose: string;
  editabilityRating: number;
  criticalConstraints: string;
  dimensions: { width: number; height: number };
  position: { x: number; y: number };
  layerDepth: number;
  transparencyRequirements: string;
  styleContinuityMarkers: string;
  regenerationPrompt: string;
  lightingRequirements: string;
  perspective: string;
  styleAnchors: string;
}

interface BackgroundSpec {
  type: string;
  specification: string;
  regenerationPrompt: string;
}

interface ElementSpecificationData {
  background: BackgroundSpec;
  elements: ElementSpec[];
  referenceDimensions?: { width: number; height: number };
}

/**
 * Scale element specifications from reference size to target canvas size
 */
export function scaleElementSpecifications(
  specifications: ElementSpecificationData,
  referenceSize: { width: number; height: number },
  targetSize: { width: number; height: number }
): ElementSpecificationData {
  // Calculate scaling factors
  const scaleX = targetSize.width / referenceSize.width;
  const scaleY = targetSize.height / referenceSize.height;
  
  console.log(`Scaling elements from ${referenceSize.width}x${referenceSize.height} to ${targetSize.width}x${targetSize.height}`);
  console.log(`Scale factors: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`);
  
  return {
    ...specifications,
    background: specifications.background,
    elements: specifications.elements.map(el => ({
      ...el,
      dimensions: {
        width: Math.round(el.dimensions.width * scaleX),
        height: Math.round(el.dimensions.height * scaleY)
      },
      position: {
        x: Math.round(el.position.x * scaleX),
        y: Math.round(el.position.y * scaleY)
      }
    }))
  };
}

/**
 * Check if scaling is needed based on size comparison
 */
export function needsScaling(
  referenceSize: { width: number; height: number },
  targetSize: { width: number; height: number },
  tolerance: number = 1
): boolean {
  const widthDiff = Math.abs(referenceSize.width - targetSize.width);
  const heightDiff = Math.abs(referenceSize.height - targetSize.height);
  
  return widthDiff > tolerance || heightDiff > tolerance;
}

