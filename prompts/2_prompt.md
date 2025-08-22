const elementSpecificationPrompt = `As a Senior Digital Production Artist with expertise in ad banner creation, analyze this reference banner design and generate SPECIFICATION SHEETS for each editable element. DO NOT describe what you see - instead, provide PRODUCTION-GRADE specifications for regenerating each element separately with perfect transparency.

Reference banner concept:
${JSON.stringify(selectedConcept)}

Reference visual (for context only):
[BASE64_ENCODED_REFERENCE_IMAGE]

CRITICAL INSTRUCTIONS:
1. For each element, provide specifications as if briefing a designer who will recreate it from scratch
2. NEVER describe the reference image - focus on production requirements
3. Text elements MUST specify: exact font family, size, weight, tracking, and color codes
4. For graphics, specify: lighting continuity requirements, perspective angle, and transparency zones
5. Identify which elements are "locked" (cannot be edited without breaking design)

For EACH element, provide:

1. **Element Blueprint**:
   - Type: [Primary Product/Text/CTA/etc.]
   - Purpose: [What this element communicates to viewers]
   - Editability Rating: [1-5, where 5 = fully editable]
   - Critical Constraints: [e.g., "Logo must maintain 2:1 aspect ratio"]

2. **Technical Specification**:
   - Dimensions: {width, height} in pixels (scaled to banner size)
   - Position: {x, y} coordinates (top-left origin)
   - Layer Depth: [1-10, 10 = foreground]
   - Transparency Requirements: [Specific areas that MUST be transparent]
   - Style Continuity Markers: [e.g., "Match Kodachrome grain from background"]

3. **Regeneration Protocol**:
   - Generation Prompt: [Precise description for creating THIS element on transparent background]
   - Lighting Requirements: [e.g., "30° side lighting matching reference"]
   - Perspective: [e.g., "Isometric 15° angle"]
   - Style Anchors: [e.g., "Match brush stroke texture from reference"]

Output STRICTLY as JSON with this structure:
{
  "background": {
    "type": "Background",
    "specification": "string",
    "regenerationPrompt": "string"
  },
  "elements": [{
    "id": "UUID",
    "name": "string (semantic name like 'primary-cta-button')",
    "type": "string",
    "purpose": "string",
    "editabilityRating": number,
    "criticalConstraints": "string",
    "dimensions": {"width": number, "height": number},
    "position": {"x": number, "y": number},
    "layerDepth": number,
    "transparencyRequirements": "string",
    "styleContinuityMarkers": "string",
    "regenerationPrompt": "string",
    "lightingRequirements": "string",
    "perspective": "string",
    "styleAnchors": "string"
  }]
}`