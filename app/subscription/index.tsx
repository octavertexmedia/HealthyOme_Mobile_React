import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import Button from '../../src/shared/components/Button';

const BENEFITS = [
  { icon: '💰', title: 'Save More', desc: 'Up to 30% cheaper than daily orders' },
  { icon: '🥗', title: 'Fresh Daily', desc: 'Meals prepared fresh every day' },
  { icon: '🎯', title: 'Stay Consistent', desc: 'Build healthy eating habits' },
  { icon: '📅', title: 'Flexible Plans', desc: 'Hold, pause, or cancel anytime' },
  { icon: '🏷️', title: 'Free Meals', desc: 'Get bonus free meals included' },
  { icon: '💸', title: 'Cashback', desc: 'Earn cashback on every plan' },
];

export default function SubscriptionIntro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.heroBanner}>
          <Text style={{ fontSize: 48 }}>🍽️</Text>
          <Text style={styles.heroTitle}>Subscription Meals</Text>
          <Text style={styles.heroSubtitle}>Healthy meals delivered daily at the best price</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Why Subscribe?</Text>

        <View style={styles.benefitsGrid}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefitCard}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="View Plans & Pricing"
          onPress={() => router.push('/subscription/plans')}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  scrollContent: { paddingHorizontal: spacing.xl },
  heroBanner: {
    borderRadius: borderRadius.xl, padding: spacing.xxl, alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  heroTitle: { ...typography.heading.xl, color: colors.text.primary, marginTop: spacing.md, textAlign: 'center' },
  heroSubtitle: { ...typography.body.lg, color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
  sectionTitle: { ...typography.heading.lg, color: colors.text.primary, marginBottom: spacing.lg },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  benefitCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  benefitIcon: { fontSize: 28, marginBottom: spacing.sm },
  benefitTitle: { ...typography.heading.sm, color: colors.text.primary, marginBottom: spacing.xs },
  benefitDesc: { ...typography.body.sm, color: colors.text.secondary, lineHeight: 18 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
  },
});
