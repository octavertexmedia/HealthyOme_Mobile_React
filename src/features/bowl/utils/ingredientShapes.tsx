/**
 * SVG-based ingredient shape renderers.
 * Each ingredient is drawn as realistic-looking cooked food pieces using SVG paths.
 * All shapes are designed to look like top-down view of food in a bowl.
 */
import React from 'react';
import Svg, { Path, Ellipse, Circle, G, Rect, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';

// ─── VEGGIES ───

export function BroccoliFloret({ size = 24, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" opacity={opacity}>
      <Defs>
        <RadialGradient id="brocGrad" cx="50%" cy="40%" r="50%">
          <Stop offset="0%" stopColor="#5DBB3F" />
          <Stop offset="70%" stopColor="#3A8B25" />
          <Stop offset="100%" stopColor="#2D6B1C" />
        </RadialGradient>
      </Defs>
      {/* Stem */}
      <Rect x="17" y="28" width="6" height="10" rx="2" fill="#6B8E4E" />
      {/* Floret clusters */}
      <Circle cx="14" cy="16" r="7" fill="url(#brocGrad)" />
      <Circle cx="26" cy="16" r="7" fill="url(#brocGrad)" />
      <Circle cx="20" cy="10" r="7" fill="url(#brocGrad)" />
      <Circle cx="20" cy="20" r="6" fill="url(#brocGrad)" />
      {/* Highlight dots */}
      <Circle cx="16" cy="13" r="1.2" fill="#82D969" opacity={0.7} />
      <Circle cx="24" cy="14" r="1" fill="#82D969" opacity={0.6} />
      <Circle cx="20" cy="8" r="1.2" fill="#82D969" opacity={0.7} />
    </Svg>
  );
}

export function BellPepperSlice({ size = 28, opacity = 1, color = 'red' }: { size?: number; opacity?: number; color?: 'red' | 'yellow' | 'green' }) {
  const colors = {
    red: { main: '#E24B3A', light: '#F07060', dark: '#C43828' },
    yellow: { main: '#F5C842', light: '#FADE78', dark: '#D4A82A' },
    green: { main: '#5BB83A', light: '#7DD45C', dark: '#3E8A26' },
  };
  const c = colors[color];
  return (
    <Svg width={size} height={size * 0.45} viewBox="0 0 50 22" opacity={opacity}>
      <Defs>
        <LinearGradient id={`pepGrad_${color}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c.light} />
          <Stop offset="100%" stopColor={c.dark} />
        </LinearGradient>
      </Defs>
      {/* Curved pepper strip */}
      <Path
        d="M 5 18 Q 10 2, 25 3 Q 40 4, 45 18 Q 40 20, 25 19 Q 10 20, 5 18Z"
        fill={`url(#pepGrad_${color})`}
        stroke={c.dark}
        strokeWidth={0.5}
      />
      {/* Inner highlight */}
      <Path
        d="M 12 14 Q 20 6, 38 14"
        fill="none"
        stroke={c.light}
        strokeWidth={1.5}
        opacity={0.5}
      />
    </Svg>
  );
}

export function ZucchiniSlice({ size = 22, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" opacity={opacity}>
      <Defs>
        <RadialGradient id="zucGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#E8F0D0" />
          <Stop offset="60%" stopColor="#C5D8A0" />
          <Stop offset="100%" stopColor="#7BA34F" />
        </RadialGradient>
      </Defs>
      {/* Round slice */}
      <Ellipse cx="18" cy="18" rx="14" ry="14" fill="url(#zucGrad)" stroke="#7BA34F" strokeWidth={1} />
      {/* Seed pattern */}
      <Ellipse cx="14" cy="14" rx="2" ry="1" fill="#F5F5DD" opacity={0.6} transform="rotate(-30 14 14)" />
      <Ellipse cx="22" cy="14" rx="2" ry="1" fill="#F5F5DD" opacity={0.6} transform="rotate(30 22 14)" />
      <Ellipse cx="14" cy="22" rx="2" ry="1" fill="#F5F5DD" opacity={0.6} transform="rotate(30 14 22)" />
      <Ellipse cx="22" cy="22" rx="2" ry="1" fill="#F5F5DD" opacity={0.6} transform="rotate(-30 22 22)" />
      {/* Grill mark */}
      <Path d="M 6 12 L 30 24" stroke="#5A7A30" strokeWidth={1.5} opacity={0.3} />
      <Path d="M 6 20 L 30 32" stroke="#5A7A30" strokeWidth={1.5} opacity={0.25} />
    </Svg>
  );
}

export function OnionPiece({ size = 18, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" opacity={opacity}>
      <Defs>
        <RadialGradient id="onionGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#F5E8D0" />
          <Stop offset="100%" stopColor="#D4B896" />
        </RadialGradient>
      </Defs>
      {/* Caramelized onion piece */}
      <Path
        d="M 8 15 Q 15 4, 22 15 Q 15 26, 8 15Z"
        fill="url(#onionGrad)"
        stroke="#C4A070"
        strokeWidth={0.5}
      />
      {/* Ring lines */}
      <Path d="M 12 12 Q 15 8, 18 12" fill="none" stroke="#E0CDB0" strokeWidth={0.8} opacity={0.6} />
      <Path d="M 11 17 Q 15 22, 19 17" fill="none" stroke="#E0CDB0" strokeWidth={0.8} opacity={0.5} />
    </Svg>
  );
}

export function TomatoPiece({ size = 20, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" opacity={opacity}>
      <Defs>
        <RadialGradient id="tomGrad" cx="40%" cy="40%" r="55%">
          <Stop offset="0%" stopColor="#F06050" />
          <Stop offset="100%" stopColor="#C43030" />
        </RadialGradient>
      </Defs>
      {/* Cherry tomato half */}
      <Ellipse cx="16" cy="16" rx="12" ry="11" fill="url(#tomGrad)" />
      {/* Inner seed chambers */}
      <Path d="M 16 8 L 16 24" stroke="#E8908A" strokeWidth={0.6} opacity={0.4} />
      <Path d="M 8 16 L 24 16" stroke="#E8908A" strokeWidth={0.6} opacity={0.4} />
      {/* Seeds */}
      <Ellipse cx="12" cy="12" rx="1.5" ry="0.8" fill="#F5C0A0" opacity={0.6} transform="rotate(-45 12 12)" />
      <Ellipse cx="20" cy="12" rx="1.5" ry="0.8" fill="#F5C0A0" opacity={0.6} transform="rotate(45 20 12)" />
      {/* Highlight */}
      <Ellipse cx="12" cy="11" rx="3" ry="2" fill="#FF8070" opacity={0.3} />
    </Svg>
  );
}

export function CapsicumPiece({ size = 24, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size * 0.5} viewBox="0 0 44 22" opacity={opacity}>
      <Defs>
        <LinearGradient id="capsGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#4CAF50" />
          <Stop offset="100%" stopColor="#2E7D32" />
        </LinearGradient>
      </Defs>
      {/* Green capsicum strip */}
      <Path
        d="M 4 16 Q 8 3, 22 4 Q 36 5, 40 16 Q 36 19, 22 18 Q 8 19, 4 16Z"
        fill="url(#capsGrad)"
        stroke="#1B5E20"
        strokeWidth={0.5}
      />
      <Path d="M 10 12 Q 22 5, 34 12" fill="none" stroke="#66BB6A" strokeWidth={1} opacity={0.4} />
    </Svg>
  );
}

export function CarrotStick({ size = 26, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size * 0.35} height={size} viewBox="0 0 14 42" opacity={opacity}>
      <Defs>
        <LinearGradient id="carrotGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#F5A623" />
          <Stop offset="100%" stopColor="#E08820" />
        </LinearGradient>
      </Defs>
      {/* Carrot stick */}
      <Rect x="2" y="2" width="10" height="38" rx="3" fill="url(#carrotGrad)" />
      {/* Texture lines */}
      <Path d="M 4 10 L 10 10" stroke="#D4801A" strokeWidth={0.6} opacity={0.3} />
      <Path d="M 4 18 L 10 18" stroke="#D4801A" strokeWidth={0.6} opacity={0.3} />
      <Path d="M 4 26 L 10 26" stroke="#D4801A" strokeWidth={0.6} opacity={0.3} />
      <Path d="M 4 34 L 10 34" stroke="#D4801A" strokeWidth={0.6} opacity={0.3} />
    </Svg>
  );
}

// ─── PROTEINS ───

export function GrilledChickenSlice({ size = 36, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 60 36" opacity={opacity}>
      <Defs>
        <LinearGradient id="chickGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#F0D0A0" />
          <Stop offset="50%" stopColor="#D4A868" />
          <Stop offset="100%" stopColor="#C09050" />
        </LinearGradient>
      </Defs>
      {/* Chicken slice shape */}
      <Path
        d="M 6 28 Q 4 12, 15 6 Q 30 0, 45 6 Q 56 12, 54 28 Q 30 34, 6 28Z"
        fill="url(#chickGrad)"
        stroke="#A07840"
        strokeWidth={0.8}
      />
      {/* Grill marks */}
      <Path d="M 10 12 L 50 20" stroke="#8B6938" strokeWidth={2} opacity={0.35} strokeLinecap="round" />
      <Path d="M 10 18 L 50 26" stroke="#8B6938" strokeWidth={2} opacity={0.3} strokeLinecap="round" />
      <Path d="M 10 24 L 50 32" stroke="#8B6938" strokeWidth={2} opacity={0.25} strokeLinecap="round" />
      {/* Highlights */}
      <Ellipse cx="25" cy="14" rx="8" ry="4" fill="#F5E0C0" opacity={0.3} />
    </Svg>
  );
}

export function PaneerCube({ size = 28, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" opacity={opacity}>
      <Defs>
        <LinearGradient id="paneerGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFF8E8" />
          <Stop offset="100%" stopColor="#F0E0C0" />
        </LinearGradient>
      </Defs>
      {/* Top face of cube */}
      <Path d="M 8 18 L 20 10 L 32 18 L 20 26Z" fill="url(#paneerGrad)" stroke="#D4C4A0" strokeWidth={0.8} />
      {/* Right face */}
      <Path d="M 20 26 L 32 18 L 32 30 L 20 38Z" fill="#E8D8B8" stroke="#D4C4A0" strokeWidth={0.8} />
      {/* Left face */}
      <Path d="M 20 26 L 8 18 L 8 30 L 20 38Z" fill="#DDD0B0" stroke="#D4C4A0" strokeWidth={0.8} />
      {/* Grill marks on top */}
      <Path d="M 12 18 L 28 18" stroke="#C0A880" strokeWidth={1.2} opacity={0.3} strokeLinecap="round" />
      <Path d="M 14 22 L 26 14" stroke="#C0A880" strokeWidth={1.2} opacity={0.25} strokeLinecap="round" />
    </Svg>
  );
}

export function TofuCube({ size = 28, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" opacity={opacity}>
      <Defs>
        <LinearGradient id="tofuGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFF5E5" />
          <Stop offset="100%" stopColor="#F5E8D0" />
        </LinearGradient>
      </Defs>
      {/* Top */}
      <Path d="M 8 18 L 20 10 L 32 18 L 20 26Z" fill="url(#tofuGrad)" stroke="#E0D0B0" strokeWidth={0.6} />
      {/* Right */}
      <Path d="M 20 26 L 32 18 L 32 30 L 20 38Z" fill="#EEE0C8" stroke="#E0D0B0" strokeWidth={0.6} />
      {/* Left */}
      <Path d="M 20 26 L 8 18 L 8 30 L 20 38Z" fill="#E5D8C0" stroke="#E0D0B0" strokeWidth={0.6} />
      {/* Surface texture */}
      <Circle cx="16" cy="18" r="0.8" fill="#D8C8A8" opacity={0.4} />
      <Circle cx="24" cy="16" r="0.6" fill="#D8C8A8" opacity={0.3} />
      <Circle cx="20" cy="20" r="0.7" fill="#D8C8A8" opacity={0.35} />
    </Svg>
  );
}

export function EggSlice({ size = 30, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" opacity={opacity}>
      <Defs>
        <RadialGradient id="yolkGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFD740" />
          <Stop offset="100%" stopColor="#F5A623" />
        </RadialGradient>
      </Defs>
      {/* Egg white */}
      <Ellipse cx="22" cy="22" rx="18" ry="16" fill="#FAFAF0" stroke="#E8E0D0" strokeWidth={0.8} />
      {/* Inner white rim */}
      <Ellipse cx="22" cy="22" rx="15" ry="13" fill="#FFF8F0" />
      {/* Yolk */}
      <Ellipse cx="22" cy="21" rx="8" ry="7" fill="url(#yolkGrad)" />
      {/* Yolk highlight */}
      <Ellipse cx="19" cy="19" rx="3" ry="2" fill="#FFE070" opacity={0.5} />
    </Svg>
  );
}

// ─── SEEDS & NUTS ───

export function SeedPiece({ size = 8, opacity = 1, type = 'sunflower' }: { size?: number; opacity?: number; type?: 'sunflower' | 'pumpkin' | 'sesame' | 'almond' | 'walnut' }) {
  const configs: Record<string, { fill: string; shape: string }> = {
    sunflower: { fill: '#3E3E3E', shape: 'M 2 1 Q 4 0, 6 1 Q 8 3, 7 6 Q 5 8, 3 7 Q 0 5, 2 1Z' },
    pumpkin: { fill: '#4A7A3A', shape: 'M 1 4 Q 4 0, 7 4 Q 4 8, 1 4Z' },
    sesame: { fill: '#F5E8C8', shape: 'M 3 1 Q 5 0, 5 3 Q 5 7, 3 7 Q 1 7, 1 3 Q 1 0, 3 1Z' },
    almond: { fill: '#C49A6C', shape: 'M 2 1 Q 4 0, 6 2 Q 7 5, 5 7 Q 3 8, 1 6 Q 0 3, 2 1Z' },
    walnut: { fill: '#8B6648', shape: 'M 1 2 Q 4 0, 7 2 Q 8 5, 5 7 Q 2 8, 1 5Z' },
  };
  const c = configs[type];
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8" opacity={opacity}>
      <Path d={c.shape} fill={c.fill} />
    </Svg>
  );
}

// ─── SAUCES ───

export function SauceDrizzle({ width = 160, height = 100, color = 'mint', opacity = 1 }: { width?: number; height?: number; color?: string; opacity?: number }) {
  const sauceColors: Record<string, { main: string; light: string }> = {
    tandoori: { main: '#D4451A', light: '#E86840' },
    chipotle: { main: '#8B4513', light: '#A0602A' },
    mint: { main: '#3CB371', light: '#66CDAA' },
    'honey mustard': { main: '#DAA520', light: '#F0C850' },
    'honey-mustard': { main: '#DAA520', light: '#F0C850' },
    default: { main: '#C0392B', light: '#E74C3C' },
  };
  const sc = sauceColors[color.toLowerCase()] || sauceColors.default;

  return (
    <Svg width={width} height={height} viewBox="0 0 200 120" opacity={opacity}>
      {/* Drizzle lines */}
      <Path
        d="M 30 20 Q 50 40, 80 25 Q 110 10, 140 35 Q 160 50, 170 30"
        fill="none" stroke={sc.main} strokeWidth={3.5} strokeLinecap="round" opacity={0.7}
      />
      <Path
        d="M 20 55 Q 45 70, 75 50 Q 105 30, 135 55 Q 155 68, 180 50"
        fill="none" stroke={sc.main} strokeWidth={3} strokeLinecap="round" opacity={0.6}
      />
      <Path
        d="M 50 80 Q 80 95, 110 75 Q 130 60, 160 85"
        fill="none" stroke={sc.light} strokeWidth={2.5} strokeLinecap="round" opacity={0.5}
      />
      {/* Sauce drops */}
      <Circle cx="80" cy="45" r="4" fill={sc.main} opacity={0.5} />
      <Circle cx="130" cy="65" r="3" fill={sc.main} opacity={0.4} />
      <Circle cx="50" cy="35" r="2.5" fill={sc.light} opacity={0.4} />
    </Svg>
  );
}

// ─── GRAVY ───

export function GravyOverlay({ width = 160, height = 100, type = 'rajma', opacity = 1 }: { width?: number; height?: number; type?: string; opacity?: number }) {
  const gravyColors: Record<string, { main: string; bean: string }> = {
    rajma: { main: '#8B3A28', bean: '#A04030' },
    masoor: { main: '#C07040', bean: '#D48850' },
    default: { main: '#8B3A28', bean: '#A04030' },
  };
  const gc = gravyColors[type.toLowerCase()] || gravyColors.default;

  return (
    <Svg width={width} height={height} viewBox="0 0 200 120" opacity={opacity}>
      {/* Gravy pools */}
      <Ellipse cx="60" cy="40" rx="35" ry="22" fill={gc.main} opacity={0.45} />
      <Ellipse cx="140" cy="55" rx="30" ry="20" fill={gc.main} opacity={0.4} />
      <Ellipse cx="100" cy="75" rx="25" ry="18" fill={gc.main} opacity={0.35} />
      {/* Bean/lentil pieces */}
      <Ellipse cx="50" cy="35" rx="4" ry="3" fill={gc.bean} opacity={0.7} />
      <Ellipse cx="70" cy="42" rx="3.5" ry="2.5" fill={gc.bean} opacity={0.65} />
      <Ellipse cx="130" cy="50" rx="4" ry="3" fill={gc.bean} opacity={0.7} />
      <Ellipse cx="150" cy="60" rx="3" ry="2.5" fill={gc.bean} opacity={0.6} />
      <Ellipse cx="95" cy="70" rx="3.5" ry="2.5" fill={gc.bean} opacity={0.65} />
      <Ellipse cx="110" cy="80" rx="3" ry="2" fill={gc.bean} opacity={0.55} />
    </Svg>
  );
}

// ─── COMPONENT MAP ───

export type IngredientShapeType = 
  | 'broccoli' | 'bell-peppers' | 'bell_peppers' | 'bellpeppers'
  | 'zucchini' | 'onion' | 'tomato' | 'cherry-tomatoes' | 'cherry_tomatoes'
  | 'capsicum' | 'carrot' | 'carrots'
  | 'grilled-chicken' | 'grilled_chicken' | 'chicken'
  | 'grilled-paneer' | 'grilled_paneer' | 'paneer'
  | 'tofu' | 'egg'
  | 'mixed-trail' | 'mixed_trail' | 'seeds'
  | 'tandoori' | 'chipotle' | 'mint' | 'honey-mustard' | 'honey_mustard'
  | 'rajma' | 'masoor';

/**
 * Returns the JSX element for a given ingredient type at a specified size.
 */
export function getIngredientShape(
  type: string,
  size: number = 24,
  index: number = 0,
): React.ReactElement | null {
  const normalizedType = type.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

  switch (normalizedType) {
    case 'broccoli':
      return <BroccoliFloret size={size} />;
    case 'bell-peppers':
    case 'bellpeppers':
      // Alternate colors for variety
      const pepperColors: Array<'red' | 'yellow' | 'green'> = ['red', 'yellow', 'green'];
      return <BellPepperSlice size={size} color={pepperColors[index % 3]} />;
    case 'zucchini':
      return <ZucchiniSlice size={size} />;
    case 'onion':
      return <OnionPiece size={size} />;
    case 'tomato':
    case 'cherry-tomatoes':
    case 'cherry-tomato':
      return <TomatoPiece size={size} />;
    case 'capsicum':
      return <CapsicumPiece size={size} />;
    case 'carrot':
    case 'carrots':
      return <CarrotStick size={size} />;
    case 'grilled-chicken':
    case 'chicken':
      return <GrilledChickenSlice size={size} />;
    case 'grilled-paneer':
    case 'paneer':
      return <PaneerCube size={size} />;
    case 'tofu':
      return <TofuCube size={size} />;
    case 'egg':
      return <EggSlice size={size} />;
    case 'mixed-trail':
    case 'seeds':
      const seedTypes: Array<'sunflower' | 'pumpkin' | 'sesame' | 'almond' | 'walnut'> = 
        ['sunflower', 'pumpkin', 'sesame', 'almond', 'walnut'];
      return <SeedPiece size={size} type={seedTypes[index % 5]} />;
    default:
      return null;
  }
}
