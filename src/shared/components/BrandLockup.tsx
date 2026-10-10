import React from 'react';
import { Image, View, useWindowDimensions } from 'react-native';

export function brandLayout(compact: boolean, availableWidth = Number.POSITIVE_INFINITY) {
  const icon = compact ? 34 : 50; const word = compact ? 112 : 130;
  const scale = Math.min(1.5, Math.max(0, availableWidth) / (icon + word + 8));
  return { icon: icon * scale, word: word * scale, wordHeight: (compact ? 28 : 30) * scale, gap: 8 * scale };
}
/** Preserve supplied brand pixels; responsive 1.5× target without cropping or tint. */
export function BrandLockup({ compact = false, availableWidth }: { compact?: boolean; availableWidth?: number }) {
  const { width, height } = useWindowDimensions();
  if (!compact) {
    const size = Math.max(0, Math.min(300, availableWidth ?? width - 48, height * 0.30));
    return <View accessible accessibilityRole="image" accessibilityLabel="HealthyOme" style={{ alignItems: 'center', backgroundColor: 'transparent' }}>
      <Image accessible={false} source={require('../../../assets/images/branding/healthyome-login.png')} style={{ width: size, height: size, backgroundColor: 'transparent' }} resizeMode="contain" />
    </View>;
  }
  const box = brandLayout(compact, availableWidth);
  return <View accessible accessibilityRole="image" accessibilityLabel="HealthyOme" style={{ flexDirection: 'row', alignItems: 'center', gap: box.gap, backgroundColor: 'transparent' }}>
    <Image accessible={false} source={require('../../../assets/images/branding/healthyome-logo.png')} style={{ width: box.icon, height: box.icon, backgroundColor: 'transparent' }} resizeMode="contain" />
    <Image accessible={false} source={require('../../../assets/images/branding/healthyome-wordmark.png')} style={{ width: box.word, height: box.wordHeight, backgroundColor: 'transparent' }} resizeMode="contain" />
  </View>;
}
