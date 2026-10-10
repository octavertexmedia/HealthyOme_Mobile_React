import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { subscriptionApi } from '../../src/features/subscription/api/subscription.api';
import { ScreenHeader } from '../../src/shared/components/ScreenHeader';
import { useSiteSettings } from '../../src/features/catalog/hooks/useMeals';
import { accountMenu, accountMenuHref, type AccountMenuItem } from '../../src/features/auth/accountMenu';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { data: settings } = useSiteSettings();

  const activeSubsQuery = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.getActive,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const activeSub = isAuthenticated ? activeSubsQuery.data?.[0] : undefined;

  const handleItem = async (item: AccountMenuItem) => {
    try {
      if (item.kind === 'logout') {
        await logout();
        router.replace('/(auth)/login');
      } else if (item.kind === 'website') {
        await Linking.openURL(item.url);
      } else {
        const href = accountMenuHref(item, isAuthenticated);
        if (href) router.push(href);
      }
    } catch {
      Alert.alert(item.kind === 'website' ? 'Could not open website' : 'Could not complete action',
        item.kind === 'website' ? `Please visit ${item.url} in your browser.` : 'Please try again.');
    }
  };

  const sections = accountMenu(isAuthenticated, settings);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Your Account" />
      {/* HEADER */}
      <LinearGradient
        colors={['#0F3D21', '#1E6F3E']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerSubtitle}>
          {isAuthenticated && user ? (user.username || user.first_name || 'User') : 'Guest'}
        </Text>
        {!isAuthenticated && <Text style={styles.guestHint}>Browse freely. Sign in to manage your account.</Text>}
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* ACTIVE SUBSCRIPTION CARD */}
        {activeSub && (
          <View style={styles.subscriptionSection}>
            <TouchableOpacity
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="View active subscriptions"
              style={styles.subscriptionCardShadow}
              onPress={() => router.push('/subscription/my')}
            >
              <LinearGradient
                colors={['#2E8B1D', '#1E6F3E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.subscriptionCard}
              >
                <View style={styles.subHeader}>
                  <Text style={styles.subLabel}>ACTIVE SUBSCRIPTION</Text>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
                </View>
                <View style={styles.subBody}>
                  <Text style={styles.subTitle}>
                    {typeof activeSub.meal_plan_type === 'object'
                      ? activeSub.meal_plan_type?.name || 'Meal Plan'
                      : 'Meal Plan'}
                  </Text>
                  <Text style={styles.subDesc}>
                    {activeSub.deliveries_left != null ? `${activeSub.deliveries_left} deliveries left` : 'Active'}
                    {activeSub.end_date ? ` • Ends ${new Date(activeSub.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                    {activeSub.is_on_hold ? ' • On hold' : ''}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* SECTIONS */}
        {sections.map((section) => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
            
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.7}
                  accessibilityRole={item.kind === 'website' ? 'link' : 'button'}
                  accessibilityLabel={item.label}
                  accessibilityHint={item.kind === 'website' ? 'Opens the Healthy-O-Me website in your browser'
                    : item.kind === 'route' && item.needsAuth && !isAuthenticated ? 'Sign in to continue' : undefined}
                  onPress={() => { void handleItem(item); }}
                  style={[
                    styles.sectionItemRow,
                    idx !== section.items.length - 1 && styles.sectionItemBorder
                  ]}
                >
                  <View style={styles.sectionItemLeft}>
                    <Ionicons 
                      name={item.icon}
                      size={20} 
                      color={item.kind === 'logout' ? '#B42318' : '#6B7280'}
                    />
                    <Text style={[
                      styles.sectionItemLabel, 
                      item.kind === 'logout' ? { color: '#B42318' } : { color: '#1F2937' }
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons name={item.kind === 'website' ? 'open-outline'
                    : item.kind === 'route' && item.needsAuth && !isAuthenticated ? 'lock-closed-outline' : 'chevron-forward'} size={18} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  guestHint: { fontSize: 13, lineHeight: 19, color: '#E3F0DE', marginTop: 4 },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },

  /* Subscription Card */
  subscriptionSection: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    zIndex: 10,
  },
  subscriptionCardShadow: {
    shadowColor: '#1E6F3E',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  subscriptionCard: {
    borderRadius: 16,
    padding: 16,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.9)',
  },
  subBody: {
    marginTop: 8,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  subDesc: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },

  /* Sections */
  sectionWrap: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#616B63',
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    gap: 12,
  },
  sectionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  sectionItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    lineHeight: 20,
  },
});
