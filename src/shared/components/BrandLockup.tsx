import React from 'react';
import { Image, View } from 'react-native';

/** Original supplied brand pixels: never tint, crop, stretch, or redraw the wordmark. */
export function BrandLockup() {
  return <View accessible accessibilityRole="image" accessibilityLabel="HealthyOme" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Image accessible={false} source={require('../../../assets/images/branding/healthyome-logo.png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
    <Image accessible={false} source={require('../../../assets/images/branding/healthyome-wordmark.png')} style={{ width: 130, height: 30 }} resizeMode="contain" />
  </View>;
}
