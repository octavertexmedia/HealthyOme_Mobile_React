/**
 * Sector-based ingredient placement algorithm.
 * Divides the bowl into sectors and distributes ingredient pieces naturally.
 */

export interface PlacedPiece {
  id: string;
  ingredientId: number | string;
  ingredientName: string;
  ingredientType: string;
  x: number;         // percentage position within bowl (0-100)
  y: number;         // percentage position within bowl (0-100)
  rotation: number;  // degrees (0-360)
  scale: number;     // 0.7-1.3
  zIndex: number;    // layer ordering
  sectorIndex: number;
}

// Seeded random for deterministic placement given the same selections
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Bowl is represented as an ellipse. We divide it into sectors
 * (like pizza slices) and place ingredients in available sectors.
 * 
 * The bowl's visible area is an ellipse centered at (50, 50) with
 * radii roughly (40, 30) in percentage coordinates.
 * 
 * We account for the tilted/3D perspective of the bowl by offsetting
 * the y-axis slightly upward.
 */
const NUM_SECTORS = 16;
const BOWL_CENTER_X = 50;
const BOWL_CENTER_Y = 48; // Slightly above center for perspective
const BOWL_RX = 36; // Horizontal radius (percentage)
const BOWL_RY = 24; // Vertical radius (percentage) - smaller for perspective

interface SectorInfo {
  index: number;
  occupied: boolean;
  occupiedBy: string[];
  centerX: number;
  centerY: number;
  angle: number;
}

function createSectors(): SectorInfo[] {
  const sectors: SectorInfo[] = [];
  for (let i = 0; i < NUM_SECTORS; i++) {
    const angle = (i / NUM_SECTORS) * Math.PI * 2;
    // Place sector centers at ~65% of bowl radius for natural distribution
    const r = 0.65;
    const cx = BOWL_CENTER_X + Math.cos(angle) * BOWL_RX * r;
    const cy = BOWL_CENTER_Y + Math.sin(angle) * BOWL_RY * r;
    sectors.push({
      index: i,
      occupied: false,
      occupiedBy: [],
      centerX: cx,
      centerY: cy,
      angle: (angle * 180) / Math.PI,
    });
  }
  // Add inner sectors (closer to center)
  for (let i = 0; i < 8; i++) {
    const angle = ((i + 0.5) / 8) * Math.PI * 2;
    const r = 0.3;
    const cx = BOWL_CENTER_X + Math.cos(angle) * BOWL_RX * r;
    const cy = BOWL_CENTER_Y + Math.sin(angle) * BOWL_RY * r;
    sectors.push({
      index: NUM_SECTORS + i,
      occupied: false,
      occupiedBy: [],
      centerX: cx,
      centerY: cy,
      angle: (angle * 180) / Math.PI,
    });
  }
  return sectors;
}

/**
 * Determine piece count and size multiplier based on ingredient category.
 */
function getIngredientConfig(type: string): { 
  pieceCount: number; 
  sizeMultiplier: number; 
  zLayer: number;
  jitterRange: number;
} {
  const normalized = type.toLowerCase();
  
  if (['veggie', 'vegetables', 'veggies'].includes(normalized)) {
    return { pieceCount: 4, sizeMultiplier: 1.0, zLayer: 10, jitterRange: 6 };
  }
  if (['protein', 'proteins'].includes(normalized)) {
    return { pieceCount: 3, sizeMultiplier: 1.4, zLayer: 20, jitterRange: 4 };
  }
  if (['seeds_nuts', 'seeds', 'seeds-nuts', 'seeds & nuts'].includes(normalized)) {
    return { pieceCount: 8, sizeMultiplier: 0.5, zLayer: 25, jitterRange: 8 };
  }
  if (['dressing', 'sauce', 'sauces'].includes(normalized)) {
    return { pieceCount: 1, sizeMultiplier: 1.0, zLayer: 30, jitterRange: 0 };
  }
  if (['gravy'].includes(normalized)) {
    return { pieceCount: 1, sizeMultiplier: 1.0, zLayer: 28, jitterRange: 0 };
  }
  return { pieceCount: 3, sizeMultiplier: 1.0, zLayer: 15, jitterRange: 5 };
}

/**
 * Main placement function.
 * Takes an array of selected ingredients and returns placed pieces
 * with position, rotation, scale, and z-index.
 */
export function calculatePlacements(
  ingredients: Array<{
    id: number | string;
    name: string;
    ingredient_type: string;
  }>
): PlacedPiece[] {
  const sectors = createSectors();
  const allPieces: PlacedPiece[] = [];
  
  // Generate a seed from ingredient IDs for deterministic placement
  const seed = ingredients.reduce((acc, ing) => acc + (typeof ing.id === 'number' ? ing.id : ing.id.toString().charCodeAt(0)), 42);
  const rand = seededRandom(seed);
  
  // Sort ingredients by z layer so veggies are placed first, then proteins, etc.
  const sortedIngredients = [...ingredients].sort((a, b) => {
    const configA = getIngredientConfig(a.ingredient_type);
    const configB = getIngredientConfig(b.ingredient_type);
    return configA.zLayer - configB.zLayer;
  });
  
  for (const ingredient of sortedIngredients) {
    const config = getIngredientConfig(ingredient.ingredient_type);
    const normalizedType = ingredient.ingredient_type.toLowerCase();
    
    // Sauces and gravy are overlay layers, not placed in sectors
    if (['dressing', 'sauce', 'sauces', 'gravy'].includes(normalizedType)) {
      allPieces.push({
        id: `${ingredient.id}-overlay`,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        ingredientType: ingredient.ingredient_type,
        x: BOWL_CENTER_X,
        y: BOWL_CENTER_Y,
        rotation: 0,
        scale: 1,
        zIndex: config.zLayer,
        sectorIndex: -1,
      });
      continue;
    }
    
    // For seed / nut items, scatter widely
    if (['seeds_nuts', 'seeds', 'seeds-nuts', 'seeds & nuts'].includes(normalizedType)) {
      for (let p = 0; p < config.pieceCount; p++) {
        // Random position within bowl ellipse
        const angle = rand() * Math.PI * 2;
        const r = rand() * 0.8;
        const x = BOWL_CENTER_X + Math.cos(angle) * BOWL_RX * r;
        const y = BOWL_CENTER_Y + Math.sin(angle) * BOWL_RY * r;
        
        allPieces.push({
          id: `${ingredient.id}-s-${p}`,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          ingredientType: ingredient.ingredient_type,
          x,
          y,
          rotation: rand() * 360,
          scale: 0.6 + rand() * 0.6,
          zIndex: config.zLayer + p * 0.1,
          sectorIndex: -1,
        });
      }
      continue;
    }
    
    // For veggies and proteins, use sector-based placement
    const availableSectors = sectors.filter(s => 
      !s.occupied || s.occupiedBy.length < 2
    );
    
    // Shuffle available sectors
    for (let i = availableSectors.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [availableSectors[i], availableSectors[j]] = [availableSectors[j], availableSectors[i]];
    }
    
    const piecesToPlace = Math.min(config.pieceCount, availableSectors.length);
    
    for (let p = 0; p < piecesToPlace; p++) {
      const sector = availableSectors[p];
      
      // Add jitter to the sector center for natural look
      const jitterX = (rand() - 0.5) * config.jitterRange * 2;
      const jitterY = (rand() - 0.5) * config.jitterRange * 2;
      
      let x = sector.centerX + jitterX;
      let y = sector.centerY + jitterY;
      
      // Clamp within bowl ellipse
      const dx = (x - BOWL_CENTER_X) / BOWL_RX;
      const dy = (y - BOWL_CENTER_Y) / BOWL_RY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.9) {
        const scale = 0.85 / dist;
        x = BOWL_CENTER_X + (x - BOWL_CENTER_X) * scale;
        y = BOWL_CENTER_Y + (y - BOWL_CENTER_Y) * scale;
      }
      
      // Mark sector as occupied
      sector.occupied = true;
      sector.occupiedBy.push(ingredient.name);
      
      allPieces.push({
        id: `${ingredient.id}-${p}`,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        ingredientType: ingredient.ingredient_type,
        x,
        y,
        rotation: rand() * 360,
        scale: (0.8 + rand() * 0.4) * config.sizeMultiplier,
        zIndex: config.zLayer + p * 0.1,
        sectorIndex: sector.index,
      });
    }
  }
  
  // Sort by zIndex for rendering order
  allPieces.sort((a, b) => a.zIndex - b.zIndex);
  
  return allPieces;
}

/**
 * Check if a base ingredient is a rice type (for gravy applicability)
 */
export function isRiceBase(baseName: string): boolean {
  const lower = baseName.toLowerCase();
  return lower.includes('rice') || lower.includes('brown rice') || lower.includes('white rice');
}
