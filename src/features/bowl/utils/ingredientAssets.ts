/**
 * Maps ingredient names to their visual assets and rendering configuration.
 * Uses the base PNG textures for base ingredients and SVG shapes for toppings.
 */

// ─── BASE TEXTURES ───
// These are the circular PNG textures that fill the bowl when a base is selected.

export const BASE_TEXTURES: Record<string, any> = {
  'quinoa base': require('../../../../assets/images/figma/bowl-builder/bases/quinoa.png'),
  'quinoa': require('../../../../assets/images/figma/bowl-builder/bases/quinoa.png'),
  'brown rice': require('../../../../assets/images/figma/bowl-builder/bases/brown-rice.png'),
  'white rice': require('../../../../assets/images/figma/bowl-builder/bases/white-rice.png'),
  'mixed greens': require('../../../../assets/images/figma/bowl-builder/bases/mixed-greens.png'),
  'lettuce': require('../../../../assets/images/figma/bowl-builder/bases/mixed-greens.png'),
  'pasta': require('../../../../assets/images/figma/bowl-builder/bases/pasta.png'),
  'barley': require('../../../../assets/images/figma/bowl-builder/bases/quinoa.png'), // fallback
};

/**
 * Returns the base texture image source for a given base name.
 */
export function getBaseTexture(baseName: string): any {
  const lower = baseName.toLowerCase().trim();
  return BASE_TEXTURES[lower] || null;
}

/**
 * Maps ingredient names to their SVG shape renderer key.
 * This normalizes various ingredient name formats to match our shape renderers.
 */
export function getIngredientShapeKey(name: string): string {
  const lower = name.toLowerCase().trim();
  
  // Veggie mappings
  if (lower.includes('broccoli')) return 'broccoli';
  if (lower.includes('bell pepper')) return 'bell-peppers';
  if (lower.includes('zucchini')) return 'zucchini';
  if (lower.includes('onion')) return 'onion';
  if (lower.includes('tomato')) return 'tomato';
  if (lower.includes('cherry tom')) return 'cherry-tomatoes';
  if (lower.includes('capsicum')) return 'capsicum';
  if (lower.includes('carrot')) return 'carrots';
  
  // Protein mappings
  if (lower.includes('chicken')) return 'grilled-chicken';
  if (lower.includes('paneer')) return 'grilled-paneer';
  if (lower.includes('tofu')) return 'tofu';
  if (lower.includes('egg')) return 'egg';
  
  // Seeds
  if (lower.includes('trail') || lower.includes('seed') || lower.includes('nut')) return 'mixed-trail';
  
  // Sauces
  if (lower.includes('tandoori')) return 'tandoori';
  if (lower.includes('chipotle')) return 'chipotle';
  if (lower.includes('mint')) return 'mint';
  if (lower.includes('honey') || lower.includes('mustard')) return 'honey-mustard';
  
  // Gravy
  if (lower.includes('rajma')) return 'rajma';
  if (lower.includes('masoor')) return 'masoor';
  
  // Fallback: use the name itself
  return lower.replace(/\s+/g, '-');
}

/**
 * Ingredient piece sizes based on type category.
 */
export function getIngredientSize(ingredientType: string): number {
  const type = ingredientType.toLowerCase();
  
  if (['protein', 'proteins'].includes(type)) return 32; // Larger pieces
  if (['veggie', 'vegetables'].includes(type)) return 24;
  if (['seeds_nuts', 'seeds'].includes(type)) return 10;
  if (['dressing', 'sauce'].includes(type)) return 20; // Not used for SVG overlays
  if (['gravy'].includes(type)) return 20;
  
  return 22; // Default
}

// ─── BOWL SHELL ───
export const BOWL_SHELL = require('../../../../assets/images/figma/bowl-builder/bowl-shell.png');
export const EMPTY_BOWL = require('../../../../assets/images/figma/bowl-builder/bowl-1.png');
