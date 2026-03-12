import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';

const MENU_ITEMS = [
  { icon: 'person-outline', label: 'Edit Profile', route: '/profile-pages/edit' },
  { icon: 'location-outline', label: 'My Addresses', route: '/profile-pages/addresses' },
  { icon: 'heart-outline', label: 'Favourites', route: '/profile-pages/favourites' },
  { icon: 'pricetag-outline', label: 'Offers & Coupons', route: '/profile-pages/offers' },
  { icon: 'gift-outline', label: 'Rewards', route: '/rewards' },
  { icon: 'card-outline', label: 'Payment Modes', route: '/profile-pages/payment' },
  { icon: 'notifications-outline', label: 'Notifications', route: '/profile-pages/notifications' },
  { icon: 'help-circle-outline', label: 'FAQs', route: '/profile-pages/faqs' },
  { icon: 'chatbubble-ellipses-outline', label: 'Help & Support', route: '/profile-pages/support' },
  { icon: 'document-text-outline', label: 'Terms & Conditions', route: '/profile-pages/terms' },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            {isAuthenticated && user ? (
              <>
                <Text style={styles.profileName}>
                  {user.first_name} {user.last_name || ''}
                </Text>
                <Text style={styles.profileEmail}>{user.email || user.username}</Text>
              </>
            ) : (
              <>
                <Text style={styles.profileName}>Welcome!</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.loginLink}>Login / Sign Up →</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/orders')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="receipt" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/rewards')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="gift" size={20} color={colors.accent.orange} />
            </View>
            <Text style={styles.quickActionLabel}>Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/subscription')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="calendar" size={20} color={colors.status.info} />
            </View>
            <Text style={styles.quickActionLabel}>Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/profile-pages/addresses')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FCE4EC' }]}>
              <Ionicons name="location" size={20} color="#E91E63" />
            </View>
            <Text style={styles.quickActionLabel}>Address</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, index === MENU_ITEMS.length - 1 && styles.menuItemLast]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={20} color={colors.text.secondary} />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.disabled} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}

        {/* Version */}
        <Text style={styles.version}>Healthy-O-Me v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 100 },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl, gap: spacing.lg,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { ...typography.heading.lg, color: colors.text.primary },
  profileEmail: { ...typography.body.md, color: colors.text.secondary, marginTop: 2 },
  loginLink: { ...typography.body.lg, color: colors.primary, marginTop: 4, fontWeight: '600' },
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: spacing.xl, marginBottom: spacing.xxl,
  },
  quickAction: { alignItems: 'center', gap: spacing.sm },
  quickActionIcon: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
  },
  quickActionLabel: { ...typography.body.sm, color: colors.text.secondary },
  menuSection: {
    marginHorizontal: spacing.xl, backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuItemLabel: { ...typography.body.lg, color: colors.text.primary },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.xxl, paddingVertical: spacing.lg,
    marginHorizontal: spacing.xl,
  },
  logoutText: { ...typography.button.md, color: colors.status.error },
  version: {
    ...typography.body.sm, color: colors.text.disabled,
    textAlign: 'center', marginTop: spacing.xl, paddingBottom: spacing.xl,
  },
});
