/**
 * DynamicBowl - Main bowl visualization component.
 * 
 * Renders a layered bowl with:
 * 1. Bowl shell (the container)
 * 2. Base ingredient (rice/quinoa/pasta texture)
 * 3. Veggie pieces (SVG shapes scattered via placement algorithm)
 * 4. Protein pieces (larger SVG shapes on top)
 * 5. Seeds & nuts (small scattered SVG pieces)
 * 6. Sauce drizzle (SVG overlay)
 * 7. Gravy pockets (SVG overlay, rice bases only)
 * 
 * Supports drop-in animations using react-native-reanimated.
 */
import React, { useMemo, useCallback } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInUp,
  Layout,
} from 'react-native-reanimated';

import { calculatePlacements, PlacedPiece, isRiceBase } from '../utils/placement';
import { getBaseTexture, getIngredientShapeKey, getIngredientSize, BOWL_SHELL, EMPTY_BOWL } from '../utils/ingredientAssets';
import { getIngredientShape, SauceDrizzle, GravyOverlay } from '../utils/ingredientShapes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOWL_CONTAINER_SIZE = Math.min(SCREEN_WIDTH * 0.78, 320);
// The bowl ellipse within the container (percentages of container)
const BOWL_INNER_LEFT = 0.10;
const BOWL_INNER_TOP = 0.15;
const BOWL_INNER_WIDTH = 0.80;
const BOWL_INNER_HEIGHT = 0.55;

interface DynamicBowlProps {
  base: { id: number; name: string; price: number } | null;
  ingredients: Array<{
    id: number;
    name: string;
    ingredient_type: string;
    price: number;
  }>;
}

export default function DynamicBowl({ base, ingredients }: DynamicBowlProps) {
  // Get base texture
  const baseTexture = useMemo(() => {
    if (!base) return null;
    return getBaseTexture(base.name);
  }, [base]);

  // Separate ingredients by type for rendering
  const { toppingIngredients, sauceIngredients, gravyIngredients } = useMemo(() => {
    const tops: typeof ingredients = [];
    const sauces: typeof ingredients = [];
    const gravies: typeof ingredients = [];

    for (const ing of ingredients) {
      const type = ing.ingredient_type.toLowerCase();
      if (['dressing', 'sauce', 'sauces'].includes(type)) {
        sauces.push(ing);
      } else if (type === 'gravy') {
        gravies.push(ing);
      } else {
        tops.push(ing);
      }
    }
    return { toppingIngredients: tops, sauceIngredients: sauces, gravyIngredients: gravies };
  }, [ingredients]);

  // Calculate placement for physical ingredients (veggies, proteins, seeds)
  const placements = useMemo(() => {
    return calculatePlacements(toppingIngredients);
  }, [toppingIngredients]);

  // Convert percentage positions to pixel positions within bowl
  const renderPiece = useCallback((piece: PlacedPiece, index: number) => {
    const shapeKey = getIngredientShapeKey(piece.ingredientName);
    const baseSize = getIngredientSize(piece.ingredientType);
    const finalSize = baseSize * piece.scale;

    const shape = getIngredientShape(shapeKey, finalSize, index);
    if (!shape) return null;

    // Convert percentage to pixel within the inner bowl area
    const pixelX = BOWL_INNER_LEFT * BOWL_CONTAINER_SIZE + (piece.x / 100) * BOWL_INNER_WIDTH * BOWL_CONTAINER_SIZE - finalSize / 2;
    const pixelY = BOWL_INNER_TOP * BOWL_CONTAINER_SIZE + (piece.y / 100) * BOWL_INNER_HEIGHT * BOWL_CONTAINER_SIZE - finalSize / 2;

    return (
      <Animated.View
        key={piece.id}
        entering={FadeIn.delay(index * 40).duration(350).springify()}
        exiting={FadeOut.duration(200)}
        style={[
          styles.piece,
          {
            left: pixelX,
            top: pixelY,
            zIndex: Math.round(piece.zIndex),
            transform: [{ rotate: `${piece.rotation}deg` }],
          },
        ]}
      >
        {shape}
      </Animated.View>
    );
  }, []);

  // Check if gravy should be shown (only on rice bases)
  const showGravy = useMemo(() => {
    if (!base) return false;
    return isRiceBase(base.name) && gravyIngredients.length > 0;
  }, [base, gravyIngredients]);

  return (
    <View style={styles.container}>
      {/* Layer 1: Bowl shadow */}
      <View style={styles.bowlShadow} />
      
      {/* Layer 2: Bowl shell (bottom half – shows behind ingredients) */}
      <Image
        source={BOWL_SHELL}
        style={styles.bowlShell}
        resizeMode="contain"
      />

      {/* Layer 3: Base texture (clipped elliptically) */}
      {base && baseTexture && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={styles.baseLayer}
        >
          <View style={styles.baseClipContainer}>
            <Image
              source={baseTexture}
              style={styles.baseImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      )}

      {/* Layer 4: Ingredient pieces (veggies + proteins + seeds) */}
      {placements.map((piece, index) => renderPiece(piece, index))}

      {/* Layer 5: Sauce drizzle overlay */}
      {sauceIngredients.map((sauce) => {
        const shapeKey = getIngredientShapeKey(sauce.name);
        return (
          <Animated.View
            key={`sauce-${sauce.id}`}
            entering={FadeIn.delay(100).duration(500)}
            exiting={FadeOut.duration(300)}
            style={styles.sauceLayer}
          >
            <SauceDrizzle
              width={BOWL_CONTAINER_SIZE * BOWL_INNER_WIDTH * 0.85}
              height={BOWL_CONTAINER_SIZE * BOWL_INNER_HEIGHT * 0.7}
              color={shapeKey}
              opacity={0.85}
            />
          </Animated.View>
        );
      })}

      {/* Layer 6: Gravy overlay (rice bases only) */}
      {showGravy && gravyIngredients.map((gravy) => {
        const shapeKey = getIngredientShapeKey(gravy.name);
        return (
          <Animated.View
            key={`gravy-${gravy.id}`}
            entering={FadeIn.delay(150).duration(500)}
            exiting={FadeOut.duration(300)}
            style={styles.gravyLayer}
          >
            <GravyOverlay
              width={BOWL_CONTAINER_SIZE * BOWL_INNER_WIDTH * 0.85}
              height={BOWL_CONTAINER_SIZE * BOWL_INNER_HEIGHT * 0.7}
              type={shapeKey}
              opacity={0.8}
            />
          </Animated.View>
        );
      })}

      {/* Empty state */}
      {!base && ingredients.length === 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.emptyOverlay}>
          <Image source={EMPTY_BOWL} style={styles.emptyBowl} resizeMode="contain" />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BOWL_CONTAINER_SIZE,
    height: BOWL_CONTAINER_SIZE * 0.85,
    alignSelf: 'center',
    position: 'relative',
  },
  bowlShadow: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 100,
    transform: [{ scaleX: 1.2 }],
  },
  bowlShell: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  baseLayer: {
    position: 'absolute',
    top: BOWL_CONTAINER_SIZE * 0.18,
    left: BOWL_CONTAINER_SIZE * 0.14,
    width: BOWL_CONTAINER_SIZE * 0.72,
    height: BOWL_CONTAINER_SIZE * 0.50,
    zIndex: 2,
  },
  baseClipContainer: {
    width: '100%',
    height: '100%',
    borderRadius: BOWL_CONTAINER_SIZE * 0.36,
    overflow: 'hidden',
  },
  baseImage: {
    width: '100%',
    height: '100%',
  },
  piece: {
    position: 'absolute',
  },
  sauceLayer: {
    position: 'absolute',
    top: BOWL_CONTAINER_SIZE * 0.22,
    left: BOWL_CONTAINER_SIZE * 0.16,
    zIndex: 30,
  },
  gravyLayer: {
    position: 'absolute',
    top: BOWL_CONTAINER_SIZE * 0.22,
    left: BOWL_CONTAINER_SIZE * 0.16,
    zIndex: 28,
  },
  emptyOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  emptyBowl: {
    width: '70%',
    height: '70%',
  },
});
