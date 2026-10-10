import React, { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLockup } from './BrandLockup';
import { useSiteSettings } from '../../features/catalog/hooks/useMeals';
import { customerTabs } from '../../features/catalog/customerFeatures';
import { useCartStore } from '../../features/cart/store/cart.store';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { PlatformIcon, type NavigationIcon } from './PlatformIcon';
import { customerShellPolicy } from './shellPolicy';

export function shellTabSelected(name: string, path: string) {
  if (name === 'index') return path === '/' || path === '/index' || path.startsWith('/subscription');
  if (name === 'training') return path.startsWith('/training') || path.startsWith('/functional-training');
  if (name === 'dietitian') return path.startsWith('/dietitian') || path.startsWith('/consult');
  return path === `/${name}` || path.startsWith(`/${name}/`);
}

/** One app-owned shell outside the route stacks; provider/payment UI is untouched. */
export function CustomerShell({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const path = usePathname();
  const chrome = customerShellPolicy(path);
  const { data: settings } = useSiteSettings();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const count = useCartStore((state) => state.totalItems);
  const openLocation = () => authenticated
    ? router.push('/profile-pages/addresses')
    : router.push({ pathname: '/(auth)/login', params: { redirect: '/profile-pages/addresses' } });
  return <View style={styles.root} testID="customer-shell">
    {chrome.header && <View testID="shell-top-safe-area" style={{ paddingTop: insets.top, backgroundColor: '#fff' }}>
      <View style={styles.header} testID="customer-top-navigation">
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Select delivery location" onPress={openLocation} style={styles.iconButton}>
          <PlatformIcon name="location" />
        </TouchableOpacity>
        <View pointerEvents="none" style={styles.centerBrand} testID="centered-brand"><BrandLockup compact availableWidth={width - insets.left - insets.right - 192} /></View>
        <View style={styles.rightActions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.navigate('/(tabs)/profile')} style={styles.iconButton}>
            <PlatformIcon name="profile" size={23} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Cart, ${count} items`} onPress={() => router.navigate('/cart')} style={styles.iconButton}>
            <PlatformIcon name="cart" />
            {count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>
    </View>}
    <KeyboardAvoidingView testID="shell-keyboard-content" style={styles.content} enabled={chrome.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaInsetsContext.Provider value={{ top: chrome.header ? 0 : insets.top, bottom: chrome.tabs ? 0 : insets.bottom, left: insets.left, right: insets.right }}>
        <View style={styles.content} testID="customer-route-content">{children}</View>
      </SafeAreaInsetsContext.Provider>
      {chrome.tabs && <View style={[styles.footerSafeArea, { paddingBottom: insets.bottom }]} testID="persistent-bottom-navigation">
        <View style={styles.footer} accessibilityRole="tablist">
          {customerTabs(settings).map((tab) => {
            const selected = shellTabSelected(tab.name, path);
            return <TouchableOpacity key={tab.name} accessibilityRole="tab" accessibilityLabel={tab.title} accessibilityState={{ selected }}
              onPress={() => router.navigate((tab.name === 'index' ? '/(tabs)' : `/(tabs)/${tab.name}`) as Href)} style={styles.tab}>
              <PlatformIcon name={tab.icon as NavigationIcon} size={22} color={selected ? '#34732D' : '#49544B'} />
              <Text numberOfLines={1} style={[styles.tabLabel, selected && { color: '#34732D', fontWeight: '700' }]}>{tab.title}</Text>
            </TouchableOpacity>;
          })}
        </View>
      </View>}
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFFF8' },
  header: { height: 60, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#E7EEE4' },
  centerBrand: { position: 'absolute', left: 96, right: 96, alignItems: 'center', justifyContent: 'center' },
  rightActions: { flexDirection: 'row' },
  iconButton: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, minHeight: 0 },
  footerSafeArea: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E7EEE4' },
  footer: { flexDirection: 'row', minHeight: 60, paddingHorizontal: 8 },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabLabel: { fontSize: 10, color: '#49544B' },
  badge: { position: 'absolute', top: 1, right: 0, minWidth: 17, paddingHorizontal: 3, borderRadius: 10, backgroundColor: '#34732D' },
  badgeText: { color: '#fff', fontSize: 10, textAlign: 'center' },
});
