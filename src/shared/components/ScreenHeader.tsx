import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { PlatformIcon } from './PlatformIcon';
import { useCartStore } from '../../features/cart/store/cart.store';

export const screenHeaderMetrics = (platform: string) => ({
  minHeight: platform === 'android' ? 64 : 52,
  controlSize: platform === 'android' ? 48 : 44,
  titleSize: platform === 'android' ? 20 : 17,
  titleAlign: platform === 'android' ? 'left' as const : 'center' as const,
});

function CartAction() {
  const router = useRouter();
  const count = useCartStore((state) => state.totalItems);
  return <Pressable accessibilityRole="button" accessibilityLabel={`Cart, ${count} items`} onPress={() => router.navigate('/cart')}
    android_ripple={{ color: '#DCEAD6', borderless: true }} style={styles.control}>
    <PlatformIcon name="cart" />
    {count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text></View>}
  </Pressable>;
}

/** A single compact route bar, never a second brand/location/profile header. */
export function ScreenHeader({ title, fallback = '/(tabs)', showCart = true, backLabel = 'Go back', action }: {
  title: string; fallback?: Href; showCart?: boolean; backLabel?: string;
  action?: { label: string; onPress: () => void };
}) {
  const router = useRouter();
  const metrics = screenHeaderMetrics(Platform.OS);
  return <View testID="screen-header" style={[styles.header, { minHeight: metrics.minHeight }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={() => router.canGoBack() ? router.back() : router.replace(fallback)}
      android_ripple={{ color: '#DCEAD6', borderless: true }} style={styles.control}>
      <PlatformIcon name="back" />
    </Pressable>
    <Text accessibilityRole="header" numberOfLines={2} style={[styles.title, { fontSize: metrics.titleSize, textAlign: metrics.titleAlign }]}>{title}</Text>
    {action ? <Pressable accessibilityRole="button" accessibilityLabel={action.label} onPress={action.onPress}
      android_ripple={{ color: '#DCEAD6' }} style={styles.textAction}><Text style={styles.actionText}>{action.label}</Text></Pressable>
      : showCart ? <CartAction /> : <View style={styles.control} />}
  </View>;
}

const metrics = screenHeaderMetrics(Platform.OS);
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 8, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DCE5D8' },
  title: { flex: 1, flexShrink: 1, fontWeight: Platform.OS === 'android' ? '500' : '600', color: '#183829', paddingVertical: 8 },
  control: { width: metrics.controlSize, minHeight: metrics.controlSize, alignItems: 'center', justifyContent: 'center' },
  textAction: { minWidth: metrics.controlSize, minHeight: metrics.controlSize, justifyContent: 'center', paddingHorizontal: 4 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#34732D' },
  badge: { position: 'absolute', top: 2, right: 0, minWidth: 17, paddingHorizontal: 3, borderRadius: 10, backgroundColor: '#34732D' },
  badgeText: { color: '#fff', fontSize: 10, textAlign: 'center' },
});
