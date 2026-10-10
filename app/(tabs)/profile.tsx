import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { subscriptionApi } from '../../src/features/subscription/api/subscription.api';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuthStore();

  const activeSubsQuery = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.getActive,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const activeSub = activeSubsQuery.data?.[0];

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const sections = [
    ...(isAuthenticated ? [{
      title: "Orders",
      items: [
        { label: "All Subscriptions", icon: "cube-outline", route: "/subscription" },
        { label: "My Orders", icon: "bag-handle-outline", route: "/(tabs)/orders" },
      ],
    },
    {
      title: "Your Information",
      items: [
        { label: "Saved Address", icon: "location-outline", route: "/profile-pages/addresses" },
        { label: "Edit Profile", icon: "person-outline", route: "/profile-pages/edit" },
        { label: "Favourites", icon: "heart-outline", route: "/profile-pages/favourites" },
      ],
    },
    {
      title: "Payments",
      items: [
        { label: "My Rewards", icon: "gift-outline", route: "/rewards" },
        { label: "Payment Modes", icon: "card-outline", route: "/profile-pages/payment" },
        { label: "Offers", icon: "pricetag-outline", route: "/profile-pages/offers" },
      ],
    }] : []),
    {
      title: "Support",
      items: [
        { label: "Help & Support", icon: "help-circle-outline", route: "/profile-pages/support" },
        { label: "FAQs", icon: "document-text-outline", route: "/profile-pages/faqs" },
      ],
    },
    {
      title: "Account",
      items: [
        ...(isAuthenticated
          ? [
            { label: "Notifications", icon: "notifications-outline", route: "/profile-pages/notifications" },
            { label: "Notification Preferences", icon: "options-outline", route: "/profile-pages/preferences" },
          ]
          : []),
        { label: "Terms of Service", icon: "document-text-outline", route: "/profile-pages/terms?slug=terms" },
        { label: "Privacy Policy", icon: "shield-checkmark-outline", route: "/profile-pages/terms?slug=privacy" },
        { label: "Data Deletion", icon: "trash-outline", route: "/profile-pages/data-deletion" },
        isAuthenticated
          ? { label: "Logout", icon: "log-out-outline", route: "LOGOUT", isDanger: true }
          : { label: "Sign In", icon: "log-in-outline", route: "/(auth)/login" },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={['#0F3D21', '#1E6F3E']}
        style={[styles.headerGradient, { paddingTop: Math.max(insets.top, 20) }]}
      >
        <Text style={styles.headerTitle}>Your Account</Text>
        <Text style={styles.headerSubtitle}>
          {isAuthenticated && user ? (user.username || user.first_name || 'User') : 'Guest'}
        </Text>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ACTIVE SUBSCRIPTION CARD */}
        {activeSub && (
          <View style={styles.subscriptionSection}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.subscriptionCardShadow}
              onPress={() => router.push('/subscription' as any)}
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
        {sections.map((section, sIdx) => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.route === 'LOGOUT') {
                      handleLogout();
                    } else if (item.route) {
                      router.push(item.route as any);
                    }
                  }}
                  style={[
                    styles.sectionItemRow,
                    idx !== section.items.length - 1 && styles.sectionItemBorder
                  ]}
                >
                  <View style={styles.sectionItemLeft}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={item.isDanger ? '#EF4444' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.sectionItemLabel, 
                      item.isDanger ? { color: '#EF4444' } : { color: '#1F2937' }
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },

  /* Subscription Card */
  subscriptionSection: {
    paddingHorizontal: 16,
    marginTop: -16, 
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
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#9A9A9A',
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
    paddingVertical: 16,
  },
  sectionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionItemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
