import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';

const SUPPORT_OPTIONS = [
  { icon: 'logo-whatsapp', label: 'Chat on WhatsApp', color: '#25D366', onPress: () => Linking.openURL('https://wa.me/919876543210') },
  { icon: 'mail-outline', label: 'Email Support', color: colors.status.info, onPress: () => Linking.openURL('mailto:support@healthyome.com') },
  { icon: 'call-outline', label: 'Call Us', color: colors.primary, onPress: () => Linking.openURL('tel:+919876543210') },
];

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>How can we help you?</Text>
        {SUPPORT_OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.label} style={styles.optionCard} onPress={opt.onPress} activeOpacity={0.85}>
            <View style={[styles.optionIcon, { backgroundColor: `${opt.color}20` }]}>
              <Ionicons name={opt.icon as any} size={24} color={opt.color} />
            </View>
            <Text style={styles.optionLabel}>{opt.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.disabled} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.optionCard} onPress={() => router.push('/profile-pages/faqs')}>
          <View style={[styles.optionIcon, { backgroundColor: '#FFF3E020' }]}>
            <Ionicons name="help-circle-outline" size={24} color={colors.accent.orange} />
          </View>
          <Text style={styles.optionLabel}>FAQs</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text.disabled} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  content: { paddingHorizontal: spacing.xl },
  subtitle: { ...typography.body.lg, color: colors.text.secondary, marginBottom: spacing.xxl },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md, ...shadows.sm,
  },
  optionIcon: { width: 44, height: 44, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  optionLabel: { ...typography.body.lg, color: colors.text.primary, flex: 1 },
});
