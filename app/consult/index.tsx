import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import Button from '../../src/shared/components/Button';

const FEATURES = [
  { icon: '👩‍⚕️', title: 'Expert Dieticians', desc: 'Certified nutrition specialists' },
  { icon: '📋', title: 'Personal Plans', desc: 'Tailored meal plans for you' },
  { icon: '📱', title: 'Video Calls', desc: 'Consult from anywhere' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Monitor your health journey' },
];

const DIETICIANS = [
  { name: 'Dr. Priya Sharma', specialty: 'Weight Management', rating: 4.9, exp: '8 yrs' },
  { name: 'Dr. Rahul Mehta', specialty: 'Sports Nutrition', rating: 4.8, exp: '6 yrs' },
  { name: 'Dr. Anita Roy', specialty: 'Diabetes Care', rating: 4.9, exp: '10 yrs' },
];

export default function ConsultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consult a Dietician</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.heroBanner}>
          <Text style={{ fontSize: 48 }}>🩺</Text>
          <Text style={styles.heroTitle}>Personalized Nutrition</Text>
          <Text style={styles.heroSubtitle}>Get expert guidance tailored to your needs</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Why Consult?</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Our Dieticians</Text>
        {DIETICIANS.map((d) => (
          <TouchableOpacity key={d.name} style={styles.dieticianCard} onPress={() => router.push('/consult/booking')}>
            <View style={styles.dieticianAvatar}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dieticianName}>{d.name}</Text>
              <Text style={styles.dieticianSpec}>{d.specialty} · {d.exp}</Text>
              <View style={styles.dieticianRating}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{d.rating}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/consult/booking')}>
              <Text style={styles.bookBtnText}>Book</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  scrollContent: { paddingHorizontal: spacing.xl },
  heroBanner: { borderRadius: borderRadius.xl, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xxl },
  heroTitle: { ...typography.heading.xl, color: colors.text.primary, marginTop: spacing.md, textAlign: 'center' },
  heroSubtitle: { ...typography.body.lg, color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
  sectionTitle: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.lg, marginTop: spacing.lg },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  featureCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  featureIcon: { fontSize: 28, marginBottom: spacing.sm },
  featureTitle: { ...typography.heading.sm, color: colors.text.primary },
  featureDesc: { ...typography.body.sm, color: colors.text.secondary, marginTop: spacing.xs },
  dieticianCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md, ...shadows.sm,
  },
  dieticianAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  dieticianName: { ...typography.body.lg, color: colors.text.primary, fontWeight: '600' },
  dieticianSpec: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  dieticianRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { ...typography.body.sm, color: colors.text.primary, fontWeight: '600' },
  bookBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  bookBtnText: { ...typography.button.sm, color: '#fff' },
});
