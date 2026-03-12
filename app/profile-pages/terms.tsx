import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../src/shared/theme';

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={typography.heading.lg}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={styles.section}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>By accessing and using the Healthy-O-Me app, you agree to be bound by these Terms and Conditions.</Text>
        <Text style={styles.section}>2. Service Description</Text>
        <Text style={styles.body}>Healthy-O-Me provides healthy meal delivery services, subscription plans, and nutritional consultation services.</Text>
        <Text style={styles.section}>3. User Accounts</Text>
        <Text style={styles.body}>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account.</Text>
        <Text style={styles.section}>4. Orders & Delivery</Text>
        <Text style={styles.body}>Orders are subject to availability and delivery area coverage. We reserve the right to cancel orders if delivery is not feasible.</Text>
        <Text style={styles.section}>5. Subscriptions</Text>
        <Text style={styles.body}>Subscription plans auto-renew unless cancelled. You may pause or cancel subscriptions from your profile settings.</Text>
        <Text style={styles.section}>6. Privacy</Text>
        <Text style={styles.body}>We collect and process personal data in accordance with our Privacy Policy. Your data is securely stored and never shared without consent.</Text>
        <Text style={styles.section}>7. Contact</Text>
        <Text style={styles.body}>For queries, reach out to support@healthyome.com</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  section: { ...typography.heading.sm, color: colors.text.primary, marginTop: spacing.xxl, marginBottom: spacing.sm },
  body: { ...typography.body.md, color: colors.text.secondary, lineHeight: 22 },
});
