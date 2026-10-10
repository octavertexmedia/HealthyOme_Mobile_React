import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSiteSettings } from '../../src/features/catalog/hooks/useMeals';
import { borderRadius, colors, spacing, typography } from '../../src/shared/theme';

const REQUEST_SUBJECT = 'Data Deletion Request';

export default function DataDeletionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: settings } = useSiteSettings();
  const email = settings?.contact_email?.trim();

  const openEmailRequest = async () => {
    if (!email) {
      router.push('/profile-pages/support');
      return;
    }

    const url = `mailto:${email}?subject=${encodeURIComponent(REQUEST_SUBJECT)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Email unavailable',
        `Please contact ${email} and use “${REQUEST_SUBJECT}” as the subject.`
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backCircle}
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Deletion</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          You can request deletion of your personal data at any time. Sending a request does not
          immediately delete your account; our support team will verify it with you first.
        </Text>

        <InfoSection
          title="Option 1: Contact support"
          body="Open Help & Support and contact the team using one of the available channels. Ask for a data deletion request and include the email address or phone number associated with your account."
        />
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/profile-pages/support')}
        >
          <Ionicons name="help-circle-outline" size={19} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Open Help & Support</Text>
        </TouchableOpacity>

        <InfoSection
          title="Option 2: Email request"
          body={
            email
              ? `Email ${email} with the subject “${REQUEST_SUBJECT}” and include the email address or phone number associated with your account.`
              : `Use Help & Support to request deletion. If you email us, use “${REQUEST_SUBJECT}” as the subject.`
          }
        />
        <TouchableOpacity style={styles.primaryButton} onPress={openEmailRequest}>
          <Ionicons name="mail-outline" size={19} color={colors.text.inverse} />
          <Text style={styles.primaryButtonText}>
            {email ? 'Compose deletion request' : 'Contact support'}
          </Text>
        </TouchableOpacity>

        <InfoSection
          title="What we delete"
          body="We will delete your profile, saved addresses, order history, and other personal data we hold. Some records may be retained where required for legal, fraud-prevention, tax, or accounting obligations."
        />
        <InfoSection
          title="Timeline"
          body="We aim to confirm receipt within 5 business days and complete verified deletion requests within 30 days."
        />

        <Text style={styles.updated}>Last updated: January 2026</Text>
      </ScrollView>
    </View>
  );
}

function InfoSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { ...typography.heading.md, color: colors.text.primary },
  headerSpacer: { width: 40 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxxl },
  intro: {
    ...typography.body.md,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.heading.sm,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionBody: { ...typography.body.md, lineHeight: 22, color: colors.text.secondary },
  primaryButton: {
    minHeight: 48,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: { ...typography.button.md, color: colors.text.inverse },
  secondaryButton: {
    minHeight: 48,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryButtonText: { ...typography.button.md, color: colors.primary },
  updated: {
    ...typography.body.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
